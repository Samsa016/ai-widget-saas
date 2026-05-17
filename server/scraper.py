import warnings

import httpx
from bs4 import BeautifulSoup

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/91.0.4472.124 Safari/537.36"
    )
}

_REMOVE_TAGS = ['script', 'style', 'header', 'footer', 'nav', 'aside', 'iframe', 'form']


async def scrape_website(url: str) -> str | None:
    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=30.0) as client:
            response = await client.get(url, headers=_HEADERS)
    except httpx.RequestError as err:
        print(f"Ошибка сети: {err}")
        return None

    if response.status_code != 200:
        print(f"Ошибка соединения: HTTP {response.status_code}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')

    for tag in _REMOVE_TAGS:
        for el in soup.find_all(tag):
            el.decompose()

    if soup.body:
        return soup.body.get_text(separator=' ', strip=True)
    return ""
