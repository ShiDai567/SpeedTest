import yaml
import os
import requests
from flask import Flask, render_template, jsonify, request, Response
from flask_cors import CORS

app = Flask(__name__, static_url_path='/static')
app.config['SECRET_KEY'] = 'your-secret-key'

# 启用CORS支持
CORS(app)

# 配置文件路径
CONFIG_PATH = 'config/node.yaml'

def load_server_config():
    """加载服务器配置"""
    if not os.path.exists(CONFIG_PATH):
        # 如果配置文件不存在，则创建默认配置
        os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
        default_config = {
            'server': {
                'url': 'https://dldir1v6.qq.com/qqfile/qq/QQNT/Windows/QQ_9.9.20_250724_x64_01.exe',
                'name': 'Default Speedtest Server'
            }
        }
        with open(CONFIG_PATH, 'w') as f:
            yaml.dump(default_config, f)
        return default_config['server']
    
    # 读取现有配置
    with open(CONFIG_PATH, 'r') as f:
        config = yaml.safe_load(f)
        return config.get('server', {})

# 加载服务器配置
server_config = load_server_config()

@app.route('/')
def index():
    """主页路由"""
    return render_template('index.html', server_name=server_config.get('name', 'Unknown Server'))

@app.route('/api/config')
def get_config():
    """API端点，提供测速配置"""
    response = jsonify(server_config)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/test-file-info')
def get_test_file_info():
    """获取测试文件信息"""
    url = server_config.get('url')
    if not url:
        response = jsonify({'error': 'No download URL configured'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 400
    
    try:
        response = requests.head(url, timeout=10)
        content_length = response.headers.get('content-length')
        content_type = response.headers.get('content-type')
        
        result = {
            'size': int(content_length) if content_length else None,
            'contentType': content_type,
            'url': url
        }
        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        result = jsonify({'error': str(e)})
        result.headers.add('Access-Control-Allow-Origin', '*')
        return result, 500

@app.route('/speedtest-proxy/<path:target_url>')
def speedtest_proxy(target_url):
    """Service Worker代理端点"""
    # 这个端点主要是为了让Service Worker能够注册
    return jsonify({'message': 'Service Worker proxy endpoint'})

@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_endpoint():
    """处理上传测试的端点"""
    if request.method == 'OPTIONS':
        # 处理预检请求
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', '*')
        return response
    
    try:
        # 获取上传的数据
        uploaded_data = request.get_data()
        # 可以在这里添加数据验证逻辑
        response = jsonify({
            'status': 'success',
            'bytes_received': len(uploaded_data)
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 200
    except Exception as e:
        response = jsonify({'status': 'error', 'message': str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)