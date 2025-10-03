# 测速工具

一个基于 Flask 的网络应用，用于测试互联网速度（下载、上传、Ping）并查看历史结果。

## 功能

- **下载速度测试：** 测量您的互联网下载速度。
- **上传速度测试：** 测量您的互联网上传速度。
- **Ping/延迟测试：** 确定到服务器的延迟。
- **实时可视化：** 在测试期间使用仪表盘显示当前速度，并使用图表显示历史速度数据。
- **测试历史：** 存储并显示您的测速结果历史记录。
- **基于 Web 的用户界面：** 通过网页浏览器即可轻松访问的用户界面。

## 使用的技术

- **后端：** Python (Flask)
- **前端：** HTML, CSS, JavaScript
  - [Chart.js](https://www.chartjs.org/) 用于速度图表。
  - [Gauge.js](https://bernii.github.io/gauge.js/) 用于实时速度可视化。
- **数据存储：**(`data/speed_history.json`) 用于存储测试历史。

## 设置与安装

请按照以下步骤在您的本地机器上设置并运行项目。

### 方法一：使用 Docker (推荐)

1.  **克隆仓库：**

    ```bash
    git clone https://gitlab.com/Speed-test.git
    cd Speed-test
    ```

2.  **构建并运行 Docker 容器：**

    ```bash
    cd docker
    docker-compose up -d
    ```

### 先决条件

- Python 3.x
- `pip` (Python 包安装程序)

### 方法二：直接安装运行

1.  **克隆仓库：**

    ```bash
    git clone https://gitlab.elsworld.cn:8102/shidai/SpeedTest.git
    cd SpeedTest
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

#### 直接运行方式：

1.  **启动 Flask 应用：**

    ```bash
    gunicorn -w 4 "app:app" -b 0.0.0.0:8000
    ```

    （在开发环境中，您也可以运行 `python app.py`，它将默认在 `http://127.0.0.1:5000` 启动 Flask 开发服务器。）

2.  **访问应用：**
    打开您的网页浏览器并访问 `http://127.0.0.1:8000`（如果使用 `python app.py` 运行，则访问 `http://127.0.0.1:5000`）。

#### Docker 运行方式：

应用将在 `http://localhost:8000` 上运行。

使用以下命令管理容器：

```bash
# 查看运行日志
docker-compose logs -f

# 停止容器
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

## 项目结构

```
.
├── app.py                  # Flask 后端应用
├── README.md               # 项目说明文件
├── requirements.txt        # Python 依赖
├── data/                   # 数据存储目录
│   └── speed_history.json  # 存储测速历史
├── docker/                 # Docker 配置文件
│   ├── Dockerfile          # Docker 构建文件
│   └── docker-compose.yml  # Docker Compose 配置
├── static/                 # 静态文件 (CSS, JS, 图片)
│   ├── chart.js            # Chart.js 库
│   ├── gauge.min.js        # Gauge.js 库
│   ├── script.js           # 前端 JavaScript 逻辑
│   ├── style.css           # 前端样式
│   └── ...                 # 其他静态资源 (favicon, 图片)
└── templates/              # HTML 模板
    └── index.html          # 主网页
```

## 故障排除

1.  **权限问题：** 如果遇到权限问题，请确保 `data` 目录对应用程序可写。
2.  **端口冲突：** 如果端口 8000 已被占用，请修改 Docker Compose 文件或运行命令中的端口映射。
3.  **数据持久化：** 测速历史存储在 `data/speed_history.json`文件中，删除该文件将清除所有历史记录。
