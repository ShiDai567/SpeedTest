# 测速工具

一个基于 Flask 的网络应用，用于测试互联网速度（下载、上传、Ping）并查看历史结果。

## 功能

*   **下载速度测试：** 测量您的互联网下载速度。
*   **上传速度测试：** 测量您的互联网上传速度。
*   **Ping/延迟测试：** 确定到服务器的延迟。
*   **实时可视化：** 在测试期间使用仪表盘显示当前速度，并使用图表显示历史速度数据。
*   **测试历史：** 存储并显示您的测速结果历史记录。
*   **基于 Web 的用户界面：** 通过网页浏览器即可轻松访问的用户界面。

## 使用的技术

*   **后端：** Python (Flask)
*   **前端：** HTML, CSS, JavaScript
    *   [Chart.js](https://www.chartjs.org/) 用于速度图表。
    *   [Gauge.js](https://bernii.github.io/gauge.js/) 用于实时速度可视化。
*   **数据存储：** JSON 文件 (`data/speed_history.json`) 用于存储测试历史。

## 设置与安装

请按照以下步骤在您的本地机器上设置并运行项目。

### 先决条件

*   Python 3.x
*   `pip` (Python 包安装程序)

### 安装

1.  **克隆仓库：**

    ```bash
    git clone https://gitlab.com/Speed-test.git
    cd Speed-test
    ```

2.  **创建虚拟环境：**
    建议使用虚拟环境来管理项目依赖。

    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **安装依赖：**

    ```bash
    pip install -r requirements.txt
    ```

### 运行应用

1.  **启动 Flask 应用：**

    ```bash
    gunicorn -w 4 "app:app" -b 0.0.0.0:8000
    ```
    （在开发环境中，您也可以运行 `python app.py`，它将默认在 `http://127.0.0.1:5000` 启动 Flask 开发服务器。）

2.  **访问应用：**
    打开您的网页浏览器并访问 `http://127.0.0.1:8000`（如果使用 `python app.py` 运行，则访问 `http://127.0.0.1:5000`）。

## 项目结构

```
.
├── app.py                  # Flask 后端应用
├── README.md               # 项目说明文件
├── requirements.txt        # Python 依赖
├── data/                   # 数据存储目录
│   └── speed_history.json  # 存储测速历史
├── static/                 # 静态文件 (CSS, JS, 图片)
│   ├── chart.js            # Chart.js 库
│   ├── gauge.min.js        # Gauge.js 库
│   ├── script.js           # 前端 JavaScript 逻辑
│   ├── style.css           # 前端样式
│   └── ...                 # 其他静态资源 (favicon, 图片)
└── templates/              # HTML 模板
    └── index.html          # 主网页
```