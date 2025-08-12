// static/js/main.js
class SpeedTest {
    constructor() {
        this.downloadSpeedElement = document.getElementById('download-speed');
        this.uploadSpeedElement = document.getElementById('upload-speed');
        this.pingValueElement = document.getElementById('ping-value');
        this.downloadProgressElement = document.getElementById('download-progress');
        this.uploadProgressElement = document.getElementById('upload-progress');
        this.pingProgressElement = document.getElementById('ping-progress');
        this.statusTextElement = document.getElementById('test-status-text');
        this.statusIndicatorElement = document.getElementById('status-indicator');

        this.downloadTestButton = document.getElementById('start-download-test');
        this.uploadTestButton = document.getElementById('start-upload-test');
        this.resetButton = document.getElementById('reset-test');

        this.testFileUrl = '';
        this.testFileSize = 0;

        this.init();
    }

    init() {
        this.downloadTestButton.addEventListener('click', () => this.startDownloadTest());
        this.uploadTestButton.addEventListener('click', () => this.startUploadTest());
        this.resetButton.addEventListener('click', () => this.resetTest());

        this.loadConfig();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.testFileUrl = config.url;
        } catch (error) {
            console.error('加载配置失败:', error);
            this.updateStatus('加载配置失败');
        }
    }

    updateStatus(text) {
        this.statusTextElement.textContent = text;
    }

    activateStatusIndicator() {
        this.statusIndicatorElement.classList.add('active');
    }

    deactivateStatusIndicator() {
        this.statusIndicatorElement.classList.remove('active');
    }

    updateProgress(element, percentage) {
        element.style.width = `${percentage}%`;
    }

    resetTest() {
        this.downloadSpeedElement.textContent = '0 Mbps';
        this.uploadSpeedElement.textContent = '0 Mbps';
        this.pingValueElement.textContent = '0 ms';

        this.updateProgress(this.downloadProgressElement, 0);
        this.updateProgress(this.uploadProgressElement, 0);
        this.updateProgress(this.pingProgressElement, 0);

        this.updateStatus('准备就绪');
        this.deactivateStatusIndicator();
    }

    async startDownloadTest() {
        if (!this.testFileUrl) {
            this.updateStatus('未配置测试文件URL');
            return;
        }

        this.updateStatus('正在获取测试文件信息...');
        this.activateStatusIndicator();

        try {
            // 获取文件信息
            const infoResponse = await fetch('/api/test-file-info');
            const fileInfo = await infoResponse.json();

            if (infoResponse.status !== 200) {
                throw new Error(fileInfo.error || '获取文件信息失败');
            }

            this.testFileSize = fileInfo.size;
            this.updateStatus('开始下载测试...');

            // 执行下载测试
            await this.performDownloadTest();
        } catch (error) {
            console.error('下载测试失败:', error);
            this.updateStatus(`下载测试失败: ${error.message}`);
            this.deactivateStatusIndicator();
        }
    }

    async performDownloadTest() {
        const startTime = new Date().getTime();
        let loaded = 0;
        const progressUpdateInterval = setInterval(() => {
            if (this.testFileSize > 0) {
                const percentage = Math.min(100, (loaded / this.testFileSize) * 100);
                this.updateProgress(this.downloadProgressElement, percentage);
            }
        }, 100);

        try {
            const response = await fetch(this.testFileUrl);
            const reader = response.body.getReader();
            const contentLength = this.testFileSize;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                loaded += value.length;

                // 实时更新速度
                const elapsed = (new Date().getTime() - startTime) / 1000;
                const speedMbps = ((loaded * 8) / (1024 * 1024)) / elapsed;
                this.downloadSpeedElement.textContent = speedMbps.toFixed(2) + ' Mbps';
            }

            clearInterval(progressUpdateInterval);
            this.updateProgress(this.downloadProgressElement, 100);

            const endTime = new Date().getTime();
            const duration = (endTime - startTime) / 1000;
            const speedMbps = ((loaded * 8) / (1024 * 1024)) / duration;

            this.downloadSpeedElement.textContent = speedMbps.toFixed(2) + ' Mbps';
            this.updateStatus('下载测试完成');
        } catch (error) {
            clearInterval(progressUpdateInterval);
            throw error;
        } finally {
            this.deactivateStatusIndicator();
        }
    }

    async startUploadTest() {
        this.updateStatus('开始上传测试...');
        this.activateStatusIndicator();

        try {
            await this.performUploadTest();
        } catch (error) {
            console.error('上传测试失败:', error);
            this.updateStatus(`上传测试失败: ${error.message}`);
        } finally {
            this.deactivateStatusIndicator();
        }
    }

    async performUploadTest() {
        const chunkSize = 256 * 1024; // 256KB chunks
        const totalChunks = 100; // 100 chunks = 25.6MB
        const totalSize = chunkSize * totalChunks;

        // 创建测试数据
        const testData = new Uint8Array(chunkSize);
        for (let i = 0; i < chunkSize; i++) {
            testData[i] = Math.floor(Math.random() * 256);
        }

        let uploaded = 0;
        const startTime = new Date().getTime();

        const progressUpdateInterval = setInterval(() => {
            const percentage = Math.min(100, (uploaded / totalSize) * 100);
            this.updateProgress(this.uploadProgressElement, percentage);

            // 实时更新速度
            if (uploaded > 0) {
                const elapsed = (new Date().getTime() - startTime) / 1000;
                const speedMbps = ((uploaded * 8) / (1024 * 1024)) / elapsed;
                this.uploadSpeedElement.textContent = speedMbps.toFixed(2) + ' Mbps';
            }
        }, 100);

        try {
            for (let i = 0; i < totalChunks; i++) {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: testData
                });

                if (!response.ok) {
                    throw new Error(`上传失败: ${response.status}`);
                }

                uploaded += chunkSize;
            }

            clearInterval(progressUpdateInterval);
            this.updateProgress(this.uploadProgressElement, 100);

            const endTime = new Date().getTime();
            const duration = (endTime - startTime) / 1000;
            const speedMbps = ((totalSize * 8) / (1024 * 1024)) / duration;

            this.uploadSpeedElement.textContent = speedMbps.toFixed(2) + ' Mbps';
            this.updateStatus('上传测试完成');
        } catch (error) {
            clearInterval(progressUpdateInterval);
            throw error;
        }
    }
}

// 页面加载完成后初始化测速工具
document.addEventListener('DOMContentLoaded', () => {
    new SpeedTest();
});