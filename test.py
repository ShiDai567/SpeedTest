import json
import subprocess
import time
from datetime import datetime


def run_iperf3_test(server_host, server_port=5201, duration=10, reverse=False):
    """
    运行 iperf3 测试

    Args:
        server_host: 服务器地址
        server_port: 服务器端口，默认5201
        duration: 测试时长（秒），默认10秒
        reverse: 是否反向测试（服务器到客户端），默认False

    Returns:
        dict: 测试结果
    """
    try:
        # 构建命令
        cmd = [
            "iperf3",
            "-c",
            server_host,  # 客户端模式，连接到指定服务器
            "-p",
            str(server_port),  # 指定端口
            "-t",
            str(duration),  # 测试时长
            "-J",  # 以JSON格式输出结果
        ]

        # 如果是反向测试（上传测试）
        if reverse:
            cmd.append("-R")

        print(f"正在执行命令: {' '.join(cmd)}")

        # 执行命令
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=duration + 10,  # 超时时间比测试时长多10秒
        )

        # 检查是否有错误
        if result.returncode != 0:
            raise Exception(f"iperf3执行失败: {result.stderr}")

        # 解析JSON结果
        data = json.loads(result.stdout)

        # 提取关键信息
        start_time = datetime.fromtimestamp(data["start"]["timestamp"]["timesecs"])

        # 获取传输统计信息
        summary = data["end"]["sum_sent"] if reverse else data["end"]["sum_received"]

        total_bandwidth = summary["bits_per_second"]
        total_bytes = summary["bytes"]
        total_seconds = summary["seconds"]

        # 转换为 Mbps
        bandwidth_mbps = total_bandwidth / 1_000_000

        return {
            "success": True,
            "timestamp": start_time.isoformat(),
            "server_host": server_host,
            "server_port": server_port,
            "duration": duration,
            "direction": "upload" if reverse else "download",
            "bandwidth_bps": total_bandwidth,
            "bandwidth_mbps": round(bandwidth_mbps, 2),
            "bytes_transferred": total_bytes,
            "seconds": round(total_seconds, 2),
            "raw_output": data,
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "测试超时"}
    except json.JSONDecodeError:
        return {"success": False, "error": "无法解析iperf3输出结果"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def test_iperf3_download(server_host, server_port=5201, duration=10):
    """
    测试下载速度（服务器到客户端）
    """
    print(f"开始测试从 {server_host}:{server_port} 下载...")
    return run_iperf3_test(server_host, server_port, duration, reverse=False)


def test_iperf3_upload(server_host, server_port=5201, duration=10):
    """
    测试上传速度（客户端到服务器）
    """
    print(f"开始测试上传到 {server_host}:{server_port} ...")
    return run_iperf3_test(server_host, server_port, duration, reverse=True)


def main():
    """
    主函数 - 示例用法
    """
    # 注意：你需要有一个可用的iperf3服务器才能运行此测试
    # 可以使用公共iperf3服务器或自己搭建

    # 示例服务器（需要替换为实际可用的服务器）
    test_servers = [
        # 你可以在这里添加实际可用的iperf3服务器
        {"host": "paris.bbr.iperf.bytel.fr", "port": 5201},
        # {"host": "your-iperf3-server.com", "port": 5201}
    ]

    if not test_servers:
        print("请配置有效的iperf3服务器地址")
        print("你可以在 https://iperf.fr/iperf-servers.php 找到公共服务器")
        return

    for server in test_servers:
        print(f"\n=== 测试服务器: {server['host']}:{server['port']} ===")

        # 测试下载速度
        print("\n--- 下载测试 ---")
        download_result = test_iperf3_download(
            server["host"], server["port"], duration=10
        )

        if download_result["success"]:
            print(f"下载带宽: {download_result['bandwidth_mbps']} Mbps")
            print(f"传输字节: {download_result['bytes_transferred']} bytes")
            print(f"测试时长: {download_result['seconds']} 秒")
        else:
            print(f"下载测试失败: {download_result['error']}")

        # 测试上传速度
        print("\n--- 上传测试 ---")
        upload_result = test_iperf3_upload(server["host"], server["port"], duration=10)

        if upload_result["success"]:
            print(f"上传带宽: {upload_result['bandwidth_mbps']} Mbps")
            print(f"传输字节: {upload_result['bytes_transferred']} bytes")
            print(f"测试时长: {upload_result['seconds']} 秒")
        else:
            print(f"上传测试失败: {upload_result['error']}")


if __name__ == "__main__":
    main()
