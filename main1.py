# file: main.py
import logging
import threading
import time

import requests
from flask import Flask, jsonify, render_template

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# QQ安装包下载链接
QQ_DOWNLOAD_URL = (
    "https://dldir1v6.qq.com/qqfile/qq/QQNT/Windows/QQ_9.9.20_250724_x64_01.exe"
)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/speedtest")
def run_speedtest():
    try:
        result = {}

        # 测试实际文件下载速度
        logger.info("开始测试实际文件下载速度")
        download_result = test_actual_download()
        result.update(download_result)

        # 测试网络延迟
        logger.info("开始测试网络延迟")
        ping_result = test_ping()
        result.update(ping_result)

        # 估算上传速度（基于下载测试的一些参数）
        logger.info("估算上传速度")
        upload_result = estimate_upload_speed()
        result.update(upload_result)

        result["success"] = True
        result["server"] = "QQ下载服务器"
        logger.info(f"测速完成: {result}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"测速失败: {str(e)}")
        return jsonify(
            {"error": f"测速失败: {str(e)}", "success": False, "type": "unknown_error"}
        )


def test_actual_download():
    """测试实际文件下载速度"""
    try:
        start_time = time.time()
        downloaded_bytes = 0
        chunk_size = 8192  # 8KB chunks

        # 发起请求，只下载部分内容以节省时间
        headers = {"Range": "bytes=0-5242879"}  # 下载前5MB
        response = requests.get(
            QQ_DOWNLOAD_URL, headers=headers, stream=True, timeout=30
        )

        if response.status_code in [200, 206]:  # 200=完整内容, 206=部分内容
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    downloaded_bytes += len(chunk)

                    # 如果下载时间超过8秒，停止测试
                    if time.time() - start_time > 8:
                        break

        end_time = time.time()

        # 计算下载速度 (Mbps)
        download_time = end_time - start_time
        if download_time > 0:
            # 转换为Mbps: bytes * 8 / (1000000 * seconds)
            download_speed = (downloaded_bytes * 8) / (download_time * 1000000)
        else:
            download_speed = 0

        return {
            "download": round(download_speed, 2),
            "download_bytes": downloaded_bytes,
            "download_time": round(download_time, 2),
        }
    except Exception as e:
        logger.error(f"下载测速失败: {str(e)}")
        # 如果实际下载测试失败，返回默认值
        return {"download": 0, "download_bytes": 0, "download_time": 0}


def test_ping():
    """测试网络延迟"""
    try:
        ping_times = []

        # 进行3次ping测试取平均值
        for i in range(3):
            start_time = time.time()
            try:
                response = requests.head(QQ_DOWNLOAD_URL, timeout=5)
                if response.status_code in [200, 206, 301, 302]:
                    end_time = time.time()
                    ping_times.append((end_time - start_time) * 1000)  # 转换为毫秒
            except:
                pass  # 忽略单次失败
            time.sleep(0.1)  # 间隔100ms

        if ping_times:
            avg_ping = sum(ping_times) / len(ping_times)
            return {"ping": round(avg_ping, 2)}
        else:
            return {"ping": 0}
    except Exception as e:
        logger.error(f"Ping测试失败: {str(e)}")
        return {"ping": 0}


def estimate_upload_speed():
    """估算上传速度（基于网络情况）"""
    try:
        # 简单估算：通常上传速度是下载速度的1/4到1/10
        # 这里我们使用1/6作为估算值
        download_speed_mbps = 1  # 默认下载速度

        # 获取之前的下载速度测试结果
        try:
            headers = {"Range": "bytes=0-1048575"}  # 1MB测试
            start_time = time.time()
            response = requests.get(QQ_DOWNLOAD_URL, headers=headers, timeout=5)
            end_time = time.time()

            if response.status_code in [200, 206]:
                download_time = end_time - start_time
                if download_time > 0:
                    download_speed_mbps = (len(response.content) * 8) / (
                        download_time * 1000000
                    )
        except:
            pass

        # 估算上传速度为下载速度的1/6
        upload_speed = max(0.1, download_speed_mbps / 6)

        return {"upload": round(upload_speed, 2)}
    except Exception as e:
        logger.error(f"上传速度估算失败: {str(e)}")
        return {
            "upload": 0.1  # 返回最小值
        }


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
