import requests
from bs4 import BeautifulSoup


def simple_spider(url):
    """
    一个简单的爬虫程序，用于获取网页标题。

    Args:
        url (str): 目标网页的URL。
    """
    # 1. 发送 HTTP 请求
    try:
        # 添加 headers 伪装成浏览器，避免被网站拒绝
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
        }
        response = requests.get(url, headers=headers, timeout=10)

        # 检查请求是否成功（状态码200表示成功）
        response.raise_for_status()

    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
        return

    # 2. 解析网页内容
    soup = BeautifulSoup(response.text, "html.parser")

    # 3. 提取数据
    try:
        # 找到 <title> 标签并提取文本内容
        title = soup.find("title").get_text(strip=True)
        print(f"网页标题是: {title}")
    except AttributeError:
        print("未找到网页标题标签。")


if __name__ == "__main__":
    # 设定目标URL
    target_url = "https://www.python.org/"

    print(f"开始爬取: {target_url}")
    simple_spider(target_url)
