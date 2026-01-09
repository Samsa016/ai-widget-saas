from bs4 import BeautifulSoup
import httpx
import warnings

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

async def scrape_website(url):

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = httpx.get(url, headers=headers, verify=False, follow_redirects=True, timeout=30.0)
    except httpx.RequestError as err:
            print(f"Ошибка сети: {err}")
            return None

    
    if response.status_code != 200:
        print("Ошибка соединения, не удалось подключиться к сайту")
        return None
    
    soap = BeautifulSoup(response.text, 'html.parser')
    
    delete_element = ['script', 'style', 'header', 'footer', 'nav', 'aside', 'iframe', 'form']

    for tag_delete in delete_element:
        for tag_del in soap.find_all(tag_delete):
            tag_del.decompose()
    
    if soap.body:
        clean_text = soap.body.get_text(separator=' ', strip=True)
        return clean_text
    else: return ""

if __name__ == "__main__":
    test_url = "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html"
    print(f"Скачиваю: {test_url}")
    
    result = scrape_website(test_url)
    print("НАЧАЛО ТЕКСТА")
    print(result[:100])