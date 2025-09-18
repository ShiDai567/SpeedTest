import json
import os
import threading
import time
import uuid
from datetime import datetime

import speedtest
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# 存储历史记录的文件路径
HISTORY_FILE = "speedtest_history.json"

# 全局变量用于存储正在进行的测速任务
current_test = {}
test_lock = threading.Lock()

# 服务器列表缓存
server_list_cache = {"timestamp": 0, "data": []}
SERVER_CACHE_TTL = 3600  # 缓存1小时


def load_history():
    """加载历史记录"""
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    return []


def save_history(record):
    """保存历史记录"""
    history = load_history()
    history.append(record)
    # 只保留最近100条记录
    if len(history) > 100:
        history = history[-100:]
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f)


def run_speed_test():
    """执行测速任务"""
    with test_lock:
        current_test["status"] = "running"
        current_test["progress"] = "初始化测速..."

    try:
        # 创建 Speedtest 对象
        with test_lock:
            current_test["progress"] = "连接测速服务器..."
        s = speedtest.Speedtest()

        # 获取最佳服务器
        with test_lock:
            current_test["progress"] = "查找最佳服务器..."
        best_server = s.get_best_server()

        # 测试下载速度
        with test_lock:
            current_test["progress"] = "测试下载速度..."
        download_speed = s.download() / 1_000_000  # 转换为 Mbps

        # 测试上传速度
        with test_lock:
            current_test["progress"] = "测试上传速度..."
        upload_speed = s.upload() / 1_000_000  # 转换为 Mbps

        # 获取 ping 值
        ping = s.results.ping

        # 创建记录
        record = {
            "id": str(uuid.uuid4()),  # 使用UUID作为唯一ID
            "timestamp": datetime.now().isoformat(),
            "ping": round(ping, 2),
            "download": round(download_speed, 2),
            "upload": round(upload_speed, 2),
            "server": best_server["name"],
            "sponsor": best_server["sponsor"],
            "server_location": f"{best_server['country']} - {best_server['location']}",
            "unit": "Mbps",
        }

        # 保存记录
        save_history(record)

        with test_lock:
            current_test["status"] = "completed"
            current_test["result"] = record
            current_test["progress"] = "测速完成"

        return record
    except Exception as e:
        with test_lock:
            current_test["status"] = "error"
            current_test["error"] = str(e)
            current_test["progress"] = "测速失败"
        raise e


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/speedtest/start", methods=["POST"])
def start_speed_test():
    """开始测速任务"""
    with test_lock:
        # 检查是否已有测速任务在运行
        if current_test.get("status") == "running":
            return jsonify({"status": "error", "message": "测速任务已在运行中"}), 400

        # 重置测速状态
        current_test.clear()
        current_test["status"] = "starting"
        current_test["progress"] = "准备开始测速..."

    # 在后台线程中运行测速
    thread = threading.Thread(target=run_speed_test)
    thread.daemon = True
    thread.start()

    return jsonify({"status": "success", "message": "测速任务已启动"})


@app.route("/speedtest/status")
def get_speed_test_status():
    """获取测速状态"""
    with test_lock:
        return jsonify(current_test.copy())


@app.route("/speedtest/latest")
def get_latest_result():
    """获取最新的测速结果"""
    try:
        history = load_history()
        if history:
            # 历史记录是按追加顺序存储的，最后一条就是最新的
            latest = history[-1]
            return jsonify({"result": latest, "status": "success"})
        else:
            return jsonify({"result": None, "status": "success"})
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route("/history")
def get_history():
    """获取历史记录"""
    try:
        history = load_history()
        # 按时间倒序排列
        history.sort(key=lambda x: x["timestamp"], reverse=True)
        return jsonify({"history": history, "status": "success"})
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route("/history/<string:record_id>")
def get_history_item(record_id: str):
    """获取单条历史记录"""
    try:
        history = load_history()
        for record in history:
            if record.get("id") == record_id:
                return jsonify({"record": record, "status": "success"})
        return jsonify({"error": "记录未找到", "status": "error"}), 404
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route("/servers")
def get_servers():
    """获取可用的测速服务器列表"""
    now = time.time()
    # 检查缓存是否有效
    if now - server_list_cache["timestamp"] > SERVER_CACHE_TTL:
        try:
            s = speedtest.Speedtest()
            servers = s.get_servers()
            # 提取服务器信息
            server_list = []
            for server_id, server_info in servers.items():
                if server_info:
                    server = server_info[0]  # 取第一个服务器信息
                    server_list.append(
                        {
                            "id": server["id"],
                            "name": server["name"],
                            "sponsor": server["sponsor"],
                            "country": server["country"],
                            "location": server.get("location", "Unknown"),
                            "latency": server.get("latency", "Unknown"),
                        }
                    )
            # 更新缓存
            server_list_cache["data"] = server_list
            server_list_cache["timestamp"] = now
        except Exception as e:
            return jsonify({"error": str(e), "status": "error"}), 500

    return jsonify({"servers": server_list_cache["data"], "status": "success"})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
