// /static/js/speedtest.js
class SpeedTest {
    constructor() {
        this.serverConfig = null;
        this.downloadSpeedElement = document.getElementById('download-speed');
        this.uploadSpeedElement = document.getElementById('upload-speed');
        this.downloadProgressElement = document.getElementById('download-progress');
        this.uploadProgressElement = document.getElementById('upload-progress');
        this.startButton = document.getElementById('start-button');
        this.statusElement = document.getElementById('status');
        this.serverNameElement = document.getElementById('server-name');
        this.testFileInfo = null;
        this.serviceWorkerRegistered = false;

        this.init();
    }

    async init() {
        // 注册Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/static/js/speedtest-sw.js');
                console.log('Service Worker registered with scope:', registration.scope);
                this.serviceWorkerRegistered = true;
            } catch (error) {
                console.error('Service Worker registration failed:', error);
                this.updateStatus('Service Worker 注册失败，无法进行前端代理测速', 'error');
            }
        } else {
            console.warn('Service Worker not supported');
            this.updateStatus('浏览器不支持 Service Worker，无法进行前端代理测速', 'error');
        }

        // 获取服务器配置
        try {
            const response = await fetch('/api/config');
            this.serverConfig = await response.json();
            this.serverNameElement.textContent = this.serverConfig.name;
        } catch (error) {
            console.error('Failed to load server config:', error);
            this.serverNameElement.textContent = 'Unknown Server';
        }

        // 获取测试文件信息
        try {
            const response = await fetch('/api/test-file-info');
            this.testFileInfo = await response.json();
        } catch (error) {
            console.error('Failed to load test file info:', error);
        }

        // 绑定事件
        this.startButton.addEventListener('click', () => this.startTest());
    }

    updateStatus(message, type) {
        this.statusElement.textContent = message;
        this.statusElement.className = 'status ' + type;
        this.statusElement.style.display = 'block';
    }

    resetUI() {
        this.downloadSpeedElement.textContent = '0.00';
        this.uploadSpeedElement.textContent = '0.00';
        this.downloadProgressElement.style.width = '0%';
        this.uploadProgressElement.style.width = '0%';
    }

    async startTest() {
        if (!this.serverConfig) {
            this.updateStatus('服务器配置加载失败', 'error');
            return;
        }

        if (!this.serviceWorkerRegistered) {
            this.updateStatus('Service Worker 未注册，无法进行前端代理测速', 'error');
            return;
        }

        this.startButton.disabled = true;
        this.resetUI();
        this.updateStatus('测速进行中...', 'testing');

        try {
            // 执行下载测速
            await this.downloadTest();

            // 执行上传测速
            await this.uploadTest();

            this.updateStatus('测速完成！', 'completed');
        } catch (error) {
            console.error('测速出错:', error);
            this.updateStatus('测速出错: ' + error.message, 'error');
        } finally {
            this.startButton.disabled = false;
        }
    }

    downloadTest() {
        return new Promise((resolve, reject) => {
            // 强制使用 Service Worker 代理
            if (!this.serviceWorkerRegistered) {
                reject(new Error('Service Worker 未注册，无法进行前端代理测速'));
                return;
            }

            // 通过 Service Worker 代理访问目标 URL
            const targetUrl = `/speedtest-proxy/${encodeURIComponent(this.serverConfig.url)}`;

            const startTime = performance.now();
            let loaded = 0;
            const total = this.testFileInfo?.size || 0;

            const xhr = new XMLHttpRequest();

            // 更新下载速度显示
            const updateDownloadSpeed = () => {
                const elapsed = (performance.now() - startTime) / 1000; // 秒
                if (elapsed > 0) {
                    const speedMbps = (loaded * 8) / (elapsed * 1024 * 1024);
                    this.downloadSpeedElement.textContent = speedMbps.toFixed(2);
                }
            };

            // 定期更新速度显示
            const interval = setInterval(updateDownloadSpeed, 100);

            xhr.onprogress = (event) => {
                loaded = event.loaded;
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    this.downloadProgressElement.style.width = percentComplete + '%';
                } else if (total > 0) {
                    // 如果我们知道文件总大小
                    const percentComplete = (event.loaded / total) * 100;
                    this.downloadProgressElement.style.width = Math.min(percentComplete, 100) + '%';
                }
            };

            xhr.onload = () => {
                clearInterval(interval);
                const endTime = performance.now();
                const elapsed = (endTime - startTime) / 1000; // 秒

                const speedMbps = (loaded * 8) / (elapsed * 1024 * 1024);
                this.downloadSpeedElement.textContent = speedMbps.toFixed(2);
                this.downloadProgressElement.style.width = '100%';
                resolve();
            };

            xhr.onerror = () => {
                clearInterval(interval);
                reject(new Error('下载测试失败，请检查网络连接或服务器配置'));
            };

            xhr.ontimeout = () => {
                clearInterval(interval);
                reject(new Error('下载测试超时'));
            };

            xhr.responseType = 'arraybuffer';
            xhr.open('GET', targetUrl);
            xhr.timeout = 30000; // 30秒超时
            xhr.send();
        });
    }

    uploadTest() {
        return new Promise(async (resolve, reject) => {
            // 创建测试数据 (1MB)
            const testData = new ArrayBuffer(1024 * 1024);
            const view = new Uint8Array(testData);
            // 填充随机数据
            for (let i = 0; i < view.length; i++) {
                view[i] = Math.floor(Math.random() * 256);
            }

            const startTime = performance.now();
            let uploaded = 0;

            const xhr = new XMLHttpRequest();

            // 更新上传速度显示
            const updateUploadSpeed = () => {
                const elapsed = (performance.now() - startTime) / 1000; // 秒
                if (elapsed > 0) {
                    const speedMbps = (uploaded * 8) / (elapsed * 1024 * 1024);
                    this.uploadSpeedElement.textContent = speedMbps.toFixed(2);
                }
            };

            // 定期更新速度显示
            const interval = setInterval(updateUploadSpeed, 100);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    uploaded = event.loaded;
                    const percentComplete = (event.loaded / event.total) * 100;
                    this.uploadProgressElement.style.width = percentComplete + '%';
                }
            };

            xhr.onload = () => {
                clearInterval(interval);
                const endTime = performance.now();
                const elapsed = (endTime - startTime) / 1000; // 秒
                const speedMbps = (testData.byteLength * 8) / (elapsed * 1024 * 1024);
                this.uploadSpeedElement.textContent = speedMbps.toFixed(2);
                this.uploadProgressElement.style.width = '100%';
                resolve();
            };

            xhr.onerror = () => {
                clearInterval(interval);
                reject(new Error('上传测试失败'));
            };

            // 上传到后端
            xhr.open('POST', '/upload');
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.timeout = 30000; // 30秒超时
            xhr.send(testData);
        });
    }
}

// 页面加载完成后初始化测速工具
document.addEventListener('DOMContentLoaded', () => {
    new SpeedTest();
});