# main.py
import os
import time

import requests
import yaml
from flask import Flask, Response, jsonify, render_template, request

app = Flask(__name__, static_url_path="/static")
app.config["SECRET_KEY"] = "your-secret-key"
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 设置最大内容长度为100MB

# 配置文件路径
CONFIG_PATH = "config/node.yaml"


def load_server_config():
    """加载服务器配置"""
    if not os.path.exists(CONFIG_PATH):
        # 如果配置文件不存在，则创建默认配置
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        default_config = {
            "default_node": "node1",
            "nodes": {
                "node1": {
                    "name": "默认测速节点",
                    "url": "https://alist.elsworld.cn:8443/d/Temp/Diskgenius_Pro_x86_5.5.0.1488_cn.exe?sign=9gXPx3V8rLJnlUf5MIHfcDVJc2yIt34XCnuZPgZoCH8=:0",
                },
                "node2": {
                    "name": "备用测速节点",
                    "url": "https://dldir1v6.qq.com/qqfile/qq/QQNT/Windows/QQ_9.9.20_250724_x64_01.exe",
                },
                "node3": {
                    "name": "国际测速节点",
                    "url": "https://cdn.jsdelivr.net/gh/prometheus/prometheus@main/LICENSE",
                },
            },
        }
        with open(CONFIG_PATH, "w") as f:
            yaml.dump(default_config, f)
        return default_config

    # 读取现有配置
    with open(CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)
        return config


# 加载服务器配置
server_config = load_server_config()


@app.route("/")
def index():
    """主页路由"""
    # 获取默认节点
    default_node = server_config.get("default_node", "node1")
    nodes = server_config.get("nodes", {})
    default_node_info = nodes.get(default_node, {})

    return render_template(
        "index.html",
        server_name=default_node_info.get("name", "Unknown Server"),
        nodes=nodes,
        default_node=default_node,
    )


@app.route("/api/config")
def get_config():
    """API端点，提供测速配置"""
    return jsonify(server_config)


@app.route("/api/config/<node_id>")
def get_node_config(node_id):
    """API端点，提供指定节点的测速配置"""
    nodes = server_config.get("nodes", {})
    if node_id in nodes:
        return jsonify(nodes[node_id])
    else:
        return jsonify({"error": "Node not found"}), 404


@app.route("/api/test-file-info")
def get_test_file_info():
    """获取测试文件信息"""
    # 获取默认节点
    default_node = server_config.get("default_node", "node1")
    nodes = server_config.get("nodes", {})
    node_info = nodes.get(default_node, {})

    url = node_info.get("url")
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


@app.route("/api/test-file-info/<node_id>")
def get_node_test_file_info(node_id):
    """获取指定节点的测试文件信息"""
    nodes = server_config.get("nodes", {})
    if node_id not in nodes:
        return jsonify({"error": "Node not found"}), 404

    node_info = nodes[node_id]
    url = node_info.get("url")
    if not url:
        return jsonify({"error": "No download URL configured for this node"}), 400

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
        response = jsonify({"status": "OK"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response

    try:
        # 获取上传的数据
        uploaded_data = request.get_data()

        # 模拟处理时间（可选，根据需要调整）
        # 这有助于更真实地模拟服务器处理时间
        # time.sleep(0.001)

        # 可以在这里添加数据验证逻辑
        return jsonify({"status": "success", "bytes_received": len(uploaded_data)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# 增加一个专门用于测速的上传端点，不做任何处理直接返回
@app.route("/speedtest-upload", methods=["POST", "OPTIONS"])
def speedtest_upload_endpoint():
    """专门用于速度测试的上传端点，最小化处理时间"""
    if request.method == "OPTIONS":
        # 处理预检请求
        response = jsonify({"status": "OK"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response

    try:
        # 直接获取数据长度，不保存数据
        content_length = request.content_length or len(request.get_data())

        # 立即返回，不做任何处理
        return jsonify({"status": "success", "bytes_received": content_length}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
