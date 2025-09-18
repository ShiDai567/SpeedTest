# Flask Speed Test Website

这是一个使用 Python Flask 框架构建的完整网速测试网站项目。

## 功能

*   **实时网速测试:** 测试当前的下载速度、上传速度和延迟(Ping)。
*   **动态仪表盘:** 使用 `gauge.js` 实时美观地显示速度结果。
*   **历史记录图表:** 使用 `Chart.js` 绘制折线图，记录并展示历次测速结果。
*   **现代化界面:** 使用 HTML, CSS, 和 JavaScript 构建了响应式的、用户友好的界面。
*   **Flask 后端:** 轻量级的 Flask 应用处理测速逻辑。

## 项目结构

```
Speed-test/
├── app.py              # Flask 后端应用
├── requirements.txt    # Python 依赖
├── templates/
│   └── index.html      # 前端 HTML 模板
└── static/
    ├── style.css       # CSS 样式文件
    └── script.js       # JavaScript 逻辑文件
```

## 安装与运行

### 1. 克隆或下载项目

将项目文件保存到您的本地计算机。

### 2. 创建并激活虚拟环境 (推荐)

在项目根目录下运行以下命令：

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate
```

### 3. 安装依赖

使用 pip 安装 `requirements.txt` 文件中列出的所有依赖项：

```bash
pip install -r requirements.txt
```

### 4. 运行应用

启动 Flask 开发服务器：

```bash
python app.py
```

### 5. 访问网站

在您的浏览器中打开以下地址：

[http://127.0.0.1:5000/](http://127.0.0.1:5000/)

现在您应该能看到测速网站的界面了。点击“开始测试”按钮即可开始一次新的速度测试。

## 技术栈

*   **后端:**
    *   Python
    *   Flask
    *   `speedtest-cli`
*   **前端:**
    *   HTML
    *   CSS
    *   JavaScript
    *   `gauge.js`
    *   `Chart.js`
