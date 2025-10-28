# app.py
# Flask 测速网站的后端

import json
import logging
import os
import time

from flask import Flask, Response, jsonify, render_template, request

# 配置日志
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# 内存中的测速历史记录存储。
# 在生产应用中，您会希望使用数据库。
speed_test_history = []

# 定义历史文件路径
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
HISTORY_FILE = os.path.join(DATA_DIR, "speed_history.json")

logging.info(f"数据目录: {DATA_DIR}")
logging.info(f"历史文件路径: {HISTORY_FILE}")

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

# 内存中的测速历史记录存储。
speed_test_history = []


def load_history():
    """
    从 JSON 文件加载测速历史记录。
    """
    global speed_test_history
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            try:
                speed_test_history = json.load(f)
            except json.JSONDecodeError:
                speed_test_history = []  # 处理空或损坏的 JSON
    else:
        speed_test_history = []


def save_history(speed_history):
    """
    将当前测速历史记录保存到 JSON 文件。
    """
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(speed_history, f, indent=4)
        logging.info(f"历史记录已保存到 {HISTORY_FILE}")
    except IOError as e:
        logging.error(f"保存历史记录到 {HISTORY_FILE} 时出错: {e}")
    except Exception as e:
        logging.error(f"保存历史记录时发生未知错误: {e}")


# 应用启动时加载历史记录
load_history()


@app.route("/")
def index():
    """
    渲染网站主页。
    """
    return render_template("index.html")


@app.route("/download")
def download():
    """
    向客户端发送数据流，用于下载速度测试，持续 10 秒。
    """

    def generate():
        start_time = time.time()
        # 增加每次发送的数据量以获得更准确的结果
        while time.time() - start_time < 10:
            yield b"0" * 1024000  # 1000KB 数据块

    return Response(generate(), mimetype="application/octet-stream")


@app.route("/upload", methods=["POST"])
def upload():
    """
    接收来自客户端的数据，用于上传速度测试。
    """
    # 读取并丢弃传入数据以正确处理流
    _ = request.data
    return "OK"


@app.route("/ping")
def ping():
    """
    一个简单的端点，用于客户端测量延迟。
    """
    return "pong"


@app.route("/history", methods=["GET", "POST"])
def history():
    """
    处理测速历史记录的存储和检索。
    """
    if request.method == "POST":
        data = request.json
        # 创建一个包含服务器端时间戳和客户端 IP 的新记录
        record = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "ip": request.remote_addr,
            "ping": data.get("ping"),
            "download": data.get("download"),
            "upload": data.get("upload"),
        }
        speed_test_history.insert(0, record)  # 添加到列表顶部
        # 将历史记录保持在合理的大小（例如，最近 20 条记录）
        if len(speed_test_history) > 20:
            speed_test_history.pop()
        save_history(speed_test_history)

        return jsonify({"status": "success"})
    else:  # GET 请求
        load_history()
        return jsonify(speed_test_history)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
