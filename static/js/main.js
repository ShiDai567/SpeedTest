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
        this.downloadDetailsElement = document.getElementById('download-details');
        this.uploadDetailsElement = document.getElementById('upload-details');
        this.pingDetailsElement = document.getElementById('ping-details');
        this.historyListElement = document.getElementById('history-list');
        this.currentServerNameElement = document.getElementById('current-server-name');
        this.footerServerNameElement = document.getElementById('footer-server-name');

        this.downloadTestButton = document.getElementById('start-download-test');
        this.uploadTestButton = document.getElementById('start-upload-test');
        this.resetButton = document.getElementById('reset-test');
        this.nodeSelector = document.getElementById('node-selector');
        this.refreshNodeInfoButton = document.getElementById('refresh-node-info');

        this.testFileUrl = '';
        this.testFileSize = 0;
        this.testHistory = [];
        this.currentNode = 'node1';

        this.init();
    }

    init() {
        this.downloadTestButton.addEventListener('click', () => this.startDownloadTest());
        this.uploadTestButton.addEventListener('click', () => this.startUploadTest());
        this.resetButton.addEventListener('click', () => this.resetTest());
        this.nodeSelector.addEventListener('change', () => this.onNodeChange());
        this.refreshNodeInfoButton.addEventListener('click', () => this.refreshNodeInfo());

        this.loadConfig();
        this.loadHistory();
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            this.nodes = config.nodes || {};
            this.currentNode = config.default_node || 'node1';

            // 更新节点选择器
            this.updateNodeSelector();

            // 加载当前节点配置
            await this.loadCurrentNodeConfig();
        } catch (error) {
            console.error('加载配置失败:', error);
            this.updateStatus('加载配置失败');
        }
    }

    updateNodeSelector() {
        // 清空选择器
        this.nodeSelector.innerHTML = '';

        // 添加节点选项
        for (const [nodeId, nodeInfo] of Object.entries(this.nodes)) {
            const option = document.createElement('option');
            option.value = nodeId;
            option.textContent = nodeInfo.name;
            if (nodeId === this.currentNode) {
                option.selected = true;
            }
            this.nodeSelector.appendChild(option);
        }
    }

    async loadCurrentNodeConfig() {
        try {
            const response = await fetch(`/api/config/${this.currentNode}`);
            const nodeConfig = await response.json();

            if (response.ok) {
                this.testFileUrl = nodeConfig.url;
                this.currentServerNameElement.textContent = nodeConfig.name;
                this.footerServerNameElement.textContent = nodeConfig.name;
            } else {
                throw new Error(nodeConfig.error || '获取节点配置失败');
            }
        } catch (error) {
            console.error('加载节点配置失败:', error);
            this.updateStatus('加载节点配置失败: ' + error.message);
        }
    }

    onNodeChange() {
        this.currentNode = this.nodeSelector.value;
        this.loadCurrentNodeConfig();
        this.updateStatus('已切换节点，准备就绪');
    }

    async refreshNodeInfo() {
        this.refreshNodeInfoButton.disabled = true;
        this.updateStatus('正在刷新节点信息...');

        try {
            await this.loadCurrentNodeConfig();
            this.updateStatus('节点信息已刷新');
        } catch (error) {
            this.updateStatus('刷新节点信息失败: ' + error.message);
        } finally {
            this.refreshNodeInfoButton.disabled = false;
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

    updateDetails(element, text) {
        element.textContent = text;
    }

    resetTest() {
        this.downloadSpeedElement.textContent = '0 Mbps';
        this.uploadSpeedElement.textContent = '0 Mbps';
        this.pingValueElement.textContent = '0 ms';

        this.updateProgress(this.downloadProgressElement, 0);
        this.updateProgress(this.uploadProgressElement, 0);
        this.updateProgress(this.pingProgressElement, 0);

        this.downloadDetailsElement.textContent = '';
        this.uploadDetailsElement.textContent = '';
        this.pingDetailsElement.textContent = '';

        this.updateStatus('准备就绪');
        this.deactivateStatusIndicator();

        // 重新启用按钮
        this.downloadTestButton.disabled = false;
        this.uploadTestButton.disabled = false;
    }

    addToHistory(testType, speed, time) {
        const currentNodeName = this.nodes[this.currentNode]?.name || this.currentNode;

        const historyItem = {
            id: Date.now(),
            type: testType,
            speed: speed,
            time: time,
            timestamp: new Date().toLocaleString('zh-CN'),
            node: currentNodeName
        };

        this.testHistory.unshift(historyItem);
        // 保留最近10条记录
        if (this.testHistory.length > 10) {
            this.testHistory.pop();
        }

        this.saveHistory();
        this.renderHistory();
    }

    saveHistory() {
        localStorage.setItem('speedTestHistory', JSON.stringify(this.testHistory));
    }

    loadHistory() {
        const history = localStorage.getItem('speedTestHistory');
        if (history) {
            this.testHistory = JSON.parse(history);
            this.renderHistory();
        }
    }

    renderHistory() {
        if (this.testHistory.length === 0) {
            this.historyListElement.innerHTML = '<div class="history-placeholder">暂无测试记录</div>';
            return;
        }

        this.historyListElement.innerHTML = '';
        this.testHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div>
                    <div>${item.timestamp}</div>
                    <div class="history-node">节点: ${item.node}</div>
                </div>
                <div>
                    <div>${item.type}: ${item.speed}</div>
                    ${item.time ? `<div>耗时: ${item.time}</div>` : ''}
                </div>
            `;
            this.historyListElement.appendChild(historyItem);
        });
    }

    async startDownloadTest() {
        if (!this.testFileUrl) {
            this.updateStatus('未配置测试文件URL');
            return;
        }

        // 禁用按钮防止重复点击
        this.downloadTestButton.disabled = true;
        this.uploadTestButton.disabled = true;

        this.updateStatus('正在获取测试文件信息...');
        this.activateStatusIndicator();

        try {
            // 获取文件信息
            const infoResponse = await fetch(`/api/test-file-info/${this.currentNode}`);
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
        } finally {
            // 重新启用按钮
            this.downloadTestButton.disabled = false;
            this.uploadTestButton.disabled = false;
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

                // 更新详细信息
                this.updateDetails(this.downloadDetailsElement,
                    `已下载: ${(loaded / (1024 * 1024)).toFixed(2)} MB / ${(this.testFileSize / (1024 * 1024)).toFixed(2)} MB`);
            }

            clearInterval(progressUpdateInterval);
            this.updateProgress(this.downloadProgressElement, 100);

            const endTime = new Date().getTime();
            const duration = (endTime - startTime) / 1000;
            const speedMbps = ((loaded * 8) / (1024 * 1024)) / duration;

            this.downloadSpeedElement.textContent = speedMbps.toFixed(2) + ' Mbps';
            this.updateDetails(this.downloadDetailsElement,
                `总大小: ${(loaded / (1024 * 1024)).toFixed(2)} MB, 耗时: ${duration.toFixed(2)}s`);

            // 添加到历史记录
            this.addToHistory('下载', speedMbps.toFixed(2) + ' Mbps', duration.toFixed(2) + 's');

            this.updateStatus('下载测试完成');
        } catch (error) {
            clearInterval(progressUpdateInterval);
            throw error;
        } finally {
            this.deactivateStatusIndicator();
        }
    }

    async startUploadTest() {
        // 禁用按钮防止重复点击
        this.downloadTestButton.disabled = true;
        this.uploadTestButton.disabled = true;

        this.updateStatus('开始上传测试...');
        this.activateStatusIndicator();

        try {
            await this.performUploadTest();
        } catch (error) {
            console.error('上传测试失败:', error);
            this.updateStatus(`上传测试失败: ${error.message}`);
        } finally {
            this.deactivateStatusIndicator();
            // 重新启用按钮
            this.downloadTestButton.disabled = false;
            this.uploadTestButton.disabled = false;
        }
    }

    async performUploadTest() {
        const chunkSize = 256 * 1024; // 256KB chunks
        const concurrentUploads = 10; // 并发上传数
        const chunksPerUpload = 25; // 每个上传包含的块数
        const totalSize = chunkSize * chunksPerUpload * concurrentUploads; // 总大小

        // 创建测试数据
        const testDataArray = [];
        for (let i = 0; i < concurrentUploads; i++) {
            const testData = new Uint8Array(chunkSize * chunksPerUpload);
            for (let j = 0; j < testData.length; j++) {
                testData[j] = Math.floor(Math.random() * 256);
            }
            testDataArray.push(testData);
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

                // 更新详细信息
                this.updateDetails(this.uploadDetailsElement,
                    `已上传: ${(uploaded / (1024 * 1024)).toFixed(2)} MB / ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
            }
        }, 100);

        try {
            // 创建并发上传Promise数组
            const uploadPromises = [];

            for (let i = 0; i < concurrentUploads; i++) {
                const promise = fetch('/speedtest-upload', { // 使用新的端点
                    method: 'POST',
                    body: testDataArray[i]
                }).then(response => {
                    if (!response.ok) {
                        throw new Error(`上传失败: ${response.status}`);
                    }
                    uploaded += testDataArray[i].length;
                    return response.json();
                });

                uploadPromises.push(promise);
            }

            // 等待所有上传完成
            await Promise.all(uploadPromises);

            clearInterval(progressUpdateInterval);
            this.updateProgress(this.uploadProgressElement, 100);

            const endTime = new Date().getTime();
            const duration = (endTime - startTime) / 1000;
            const speedMbps = ((totalSize * 8) / (1024 * 1024)) / duration;

            this.uploadSpeedElement.textContent = speedMbps.toFixed(2) + ' Mbps';
            this.updateDetails(this.uploadDetailsElement,
                `总大小: ${(totalSize / (1024 * 1024)).toFixed(2)} MB, 耗时: ${duration.toFixed(2)}s`);

            // 添加到历史记录
            this.addToHistory('上传', speedMbps.toFixed(2) + ' Mbps', duration.toFixed(2) + 's');

            this.updateStatus('上传测试完成');
        } catch (error) {
            clearInterval(progressUpdateInterval);
            throw error;
        }
    }

    async performPingTest() {
        this.updateStatus('正在进行延迟测试...');
        this.activateStatusIndicator();

        try {
            const startTime = new Date().getTime();
            const response = await fetch(`/api/config/${this.currentNode}`);
            const endTime = new Date().getTime();

            if (!response.ok) {
                throw new Error('Ping测试失败');
            }

            const pingTime = endTime - startTime;
            this.pingValueElement.textContent = pingTime + ' ms';
            this.updateProgress(this.pingProgressElement, Math.min(100, pingTime / 10));
            this.updateDetails(this.pingDetailsElement, `响应时间: ${pingTime} ms`);

            // 添加到历史记录
            this.addToHistory('延迟', pingTime + ' ms', '');

            this.updateStatus('延迟测试完成');
        } catch (error) {
            console.error('Ping测试失败:', error);
            this.updateStatus(`延迟测试失败: ${error.message}`);
        } finally {
            this.deactivateStatusIndicator();
        }
    }
}

// 页面加载完成后初始化测速工具
document.addEventListener('DOMContentLoaded', () => {
    new SpeedTest();
});