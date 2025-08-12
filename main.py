# main.py
import os

import requests
import yaml
from flask import Flask, Response, jsonify, render_template, request

app = Flask(__name__, static_url_path="/static")
app.config["SECRET_KEY"] = "your-secret-key"

# 配置文件路径
CONFIG_PATH = "config/node.yaml"


def load_server_config():
    """加载服务器配置"""
    if not os.path.exists(CONFIG_PATH):
        # 如果配置文件不存在，则创建默认配置
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        default_config = {
            "server": {
                "url": "https://dldir1v6.qq.com/qqfile/qq/QQNT/Windows/QQ_9.9.20_250724_x64_01.exe",
                "name": "Default Speedtest Server",
            }
        }
        with open(CONFIG_PATH, "w") as f:
            yaml.dump(default_config, f)
        return default_config["server"]

    # 读取现有配置
    with open(CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)
        return config.get("server", {})


# 加载服务器配置
server_config = load_server_config()


@app.route("/")
def index():
    """主页路由"""
    return render_template(
        "index.html", server_name=server_config.get("name", "Unknown Server")
    )


@app.route("/api/config")
def get_config():
    """API端点，提供测速配置"""
    return jsonify(server_config)


@app.route("/api/test-file-info")
def get_test_file_info():
    """获取测试文件信息"""
    url = server_config.get("url")
    if not url:
        return jsonify({"error": "No download URL configured"}), 400

    try:
        response = requests.head(url, timeout=10)
        content_length = response.headers.get("content-length")
        content_type = response.headers.get("content-type")

        result = {
            "size": int(content_length) if content_length else None,
            "contentType": content_type,
            "url": url,
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/upload", methods=["POST", "OPTIONS"])
def upload_endpoint():
    """处理上传测试的端点"""
    if request.method == "OPTIONS":
        # 处理预检请求
        return jsonify({"status": "OK"})

    try:
        # 获取上传的数据
        uploaded_data = request.get_data()
        # 可以在这里添加数据验证逻辑
        return jsonify({"status": "success", "bytes_received": len(uploaded_data)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
