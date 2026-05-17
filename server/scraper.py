"""
Web scraper with three-layer strategy:
  1. httpx   — fast HTTP request, works on static/SSR sites
  2. Playwright — headless browser fallback for JS-rendered (SPA) sites
  3. readability-lxml — Mozilla Readability algorithm for clean content extraction
  + multi-page crawling: follows same-domain links up to max_pages
"""
from __future__ import annotations

import asyncio
import warnings
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

try:
    from readability import Document as ReadabilityDocument
    _HAS_READABILITY = True
except ImportError:
    _HAS_READABILITY = False

try:
    from playwright.async_api import async_playwright
    _HAS_PLAYWRIGHT = True
except ImportError:
    _HAS_PLAYWRIGHT = False

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

_NOISE_TAGS = ['script', 'style', 'header', 'footer', 'nav', 'aside',
               'iframe', 'form', 'noscript', 'svg', 'button']
_MIN_CHARS = 300      # below this → content is likely a JS placeholder
_MAX_PAGES = 5        # max pages to crawl per domain
_CRAWL_DELAY = 0.5    # seconds between requests (polite crawling)


# ---------------------------------------------------------------------------
# Content extraction
# ---------------------------------------------------------------------------

def _html_to_text(html: str) -> str:
    """Extract readable text from raw HTML.

    Prefers readability-lxml (Mozilla Reader Mode algorithm) which is far
    better at isolating article/page content vs. navigation noise.
    Falls back to manual tag-stripping with BeautifulSoup.
    """
    if _HAS_READABILITY:
        try:
            doc = ReadabilityDocument(html)
            summary_html = doc.summary()
            soup = BeautifulSoup(summary_html, 'html.parser')
            return soup.get_text(separator=' ', strip=True)
        except Exception:
            pass

    # Fallback: manual noise removal
    soup = BeautifulSoup(html, 'html.parser')
    for tag in _NOISE_TAGS:
        for el in soup.find_all(tag):
            el.decompose()
    if soup.body:
        return soup.body.get_text(separator=' ', strip=True)
    return soup.get_text(separator=' ', strip=True)


def _looks_empty(text: str) -> bool:
    return len(text.strip()) < _MIN_CHARS


def _same_domain_links(html: str, base_url: str, limit: int = 20) -> list[str]:
    """Return internal links found on the page, deduplicated and stripped of anchors."""
    base_netloc = urlparse(base_url).netloc
    soup = BeautifulSoup(html, 'html.parser')
    seen: set[str] = set()
    result: list[str] = []

    for a in soup.find_all('a', href=True):
        href = urljoin(base_url, a['href'])
        parsed = urlparse(href)

        if parsed.netloc != base_netloc:
            continue
        if parsed.scheme not in ('http', 'https'):
            continue

        # Normalise: drop fragment and query string
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip('/')
        if clean and clean != base_url.rstrip('/') and clean not in seen:
            seen.add(clean)
            result.append(clean)
        if len(result) >= limit:
            break

    return result


# ---------------------------------------------------------------------------
# Fetchers
# ---------------------------------------------------------------------------

async def _fetch_httpx(url: str) -> str | None:
    """Fast HTTP fetch — works on plain HTML / server-side-rendered pages."""
    try:
        async with httpx.AsyncClient(
            verify=False, follow_redirects=True, timeout=15.0
        ) as client:
            r = await client.get(url, headers=_HEADERS)
            if r.status_code == 200:
                return r.text
            print(f"httpx: HTTP {r.status_code} for {url}")
    except httpx.RequestError as e:
        print(f"httpx error for {url}: {e}")
    return None


async def _fetch_playwright(url: str) -> str | None:
    """Headless-browser fetch — handles JS-rendered (React/Vue/Angular) pages."""
    if not _HAS_PLAYWRIGHT:
        print("Playwright not installed — skipping JS fallback")
        return None
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(user_agent=_HEADERS["User-Agent"])
            try:
                # "load" fires after DOM + resources; more reliable than networkidle
                await page.goto(url, wait_until="load", timeout=20_000)
            except Exception:
                # Timeout is OK — grab whatever rendered so far
                pass
            # Give JS a moment to render after load event
            await asyncio.sleep(1.5)
            html = await page.content()
            await browser.close()
            return html
    except Exception as e:
        print(f"Playwright error for {url}: {e}")
        return None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def _scrape_one(url: str) -> tuple[str, str | None]:
    """Scrape a single URL. Returns (text, raw_html)."""
    html = await _fetch_httpx(url)
    text = _html_to_text(html) if html else ''

    if _looks_empty(text):
        print(f"Too little content via httpx ({len(text)} chars), trying Playwright…")
        html = await _fetch_playwright(url)
        text = _html_to_text(html) if html else ''

    return text, html


async def scrape_website(url: str, max_pages: int = _MAX_PAGES) -> str | None:
    """Scrape a website and return combined clean text from up to max_pages pages.

    Strategy per page:
      httpx  →  readability extraction
             ↓ (if < 300 chars)
      Playwright  →  readability extraction
    """
    text, html = await _scrape_one(url)

    if not text:
        print(f"Could not extract any content from {url}")
        return None

    pages: list[str] = [text]
    visited: set[str] = {url.rstrip('/')}

    if html and max_pages > 1:
        links = _same_domain_links(html, url)
        for link in links[: max_pages - 1]:
            normalised = link.rstrip('/')
            if normalised in visited:
                continue
            visited.add(normalised)

            await asyncio.sleep(_CRAWL_DELAY)
            page_text, _ = await _scrape_one(link)
            if page_text:
                pages.append(f"\n\n--- {link} ---\n{page_text}")

    combined = '\n'.join(pages)
    print(f"Scraped {len(visited)} page(s), {len(combined)} chars total")
    return combined
