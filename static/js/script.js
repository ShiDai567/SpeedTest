document.addEventListener('DOMContentLoaded', function () {
    // 测速相关元素
    const startButton = document.getElementById('start-test');
    const loadingElement = document.getElementById('loading');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const resultsElement = document.getElementById('results');
    const pingValue = document.getElementById('ping-value');
    const downloadValue = document.getElementById('download-value');
    const uploadValue = document.getElementById('upload-value');
    const serverValue = document.getElementById('server-value');
    const sponsorValue = document.getElementById('sponsor-value');
    const locationValue = document.getElementById('location-value');

    // 标签页相关元素
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // 标签页切换功能
    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // 更新活动标签
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 显示对应的内容面板
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabId + '-tab') {
                    pane.classList.add('active');
                }
            });

            // 根据标签页加载相应内容
            switch (tabId) {
                case 'history':
                    loadHistory();
                    break;
                case 'servers':
                    loadServers();
                    break;
            }
        });
    });

    // 开始测速功能
    startButton.addEventListener('click', function () {
        startSpeedTest();
    });

    // 开始测速
    function startSpeedTest() {
        // 禁用按钮并显示加载状态
        startButton.disabled = true;
        startButton.classList.add('hidden');
        loadingElement.classList.remove('hidden');
        resultsElement.classList.add('hidden');
        progressText.textContent = '准备开始测速...';
        progressFill.style.width = '0%';

        // 发送开始测速请求
        fetch('/speedtest/start', {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    // 开始轮询测速状态
                    pollTestStatus();
                } else {
                    throw new Error(data.message || "启动测速失败");
                }
            })
            .catch(error => {
                console.error('启动测速失败:', error);
                loadingElement.classList.add('hidden');
                startButton.classList.remove('hidden');
                startButton.disabled = false;
                alert('启动测速失败: ' + error.message);
            });
    }

    // 轮询测速状态
    function pollTestStatus() {
        fetch('/speedtest/status')
            .then(response => response.json())
            .then(data => {
                switch (data.status) {
                    case 'running':
                        // 更新进度
                        progressText.textContent = data.progress || '测速中...';
                        // 模拟进度条更新
                        if (data.progress && data.progress.includes('下载')) {
                            progressFill.style.width = '60%';
                        } else if (data.progress && data.progress.includes('上传')) {
                            progressFill.style.width = '80%';
                        } else {
                            progressFill.style.width = '40%';
                        }
                        // 继续轮询
                        setTimeout(pollTestStatus, 1000);
                        break;
                    case 'completed':
                        // 显示结果
                        displayResult(data.result);
                        loadingElement.classList.add('hidden');
                        resultsElement.classList.remove('hidden');
                        startButton.classList.remove('hidden');
                        startButton.disabled = false;
                        break;
                    case 'error':
                        throw new Error(data.error || "测速失败");
                    default:
                        // 继续轮询
                        setTimeout(pollTestStatus, 1000);
                }
            })
            .catch(error => {
                console.error('测速失败:', error);
                loadingElement.classList.add('hidden');
                startButton.classList.remove('hidden');
                startButton.disabled = false;
                alert('测速失败: ' + error.message);
            });
    }

    // 显示测速结果
    function displayResult(result) {
        if (result) {
            pingValue.textContent = result.ping;
            downloadValue.textContent = result.download;
            uploadValue.textContent = result.upload;
            serverValue.textContent = result.server;
            sponsorValue.textContent = result.sponsor;
            locationValue.textContent = result.server_location;
        }
    }

    // 加载历史记录功能
    function loadHistory() {
        const historyContent = document.getElementById('history-content');
        historyContent.innerHTML = '<p>加载中...</p>';

        fetch('/history')
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    displayHistory(data.history);
                } else {
                    throw new Error(data.error || "加载历史记录失败");
                }
            })
            .catch(error => {
                console.error('加载历史记录失败:', error);
                historyContent.innerHTML = '<p>加载历史记录失败</p>';
            });
    }

    // 显示历史记录
    function displayHistory(history) {
        const historyContent = document.getElementById('history-content');

        if (!history || history.length === 0) {
            historyContent.innerHTML = '<p class="empty-message">暂无历史记录</p>';
            return;
        }

        let historyHTML = '<div class="history-list">';
        history.forEach(record => {
            const date = new Date(record.timestamp);
            const dateString = date.toLocaleString('zh-CN');

            historyHTML += `
                <div class="history-item">
                    <div class="history-item-header">
                        <span>${dateString}</span>
                        <span>${record.sponsor} - ${record.server}</span>
                    </div>
                    <div class="history-item-results">
                        <div class="history-result-item">
                            <span class="value">${record.ping}</span>
                            <span class="label">延迟(ms)</span>
                        </div>
                        <div class="history-result-item">
                            <span class="value">${record.download}</span>
                            <span class="label">下载(Mbps)</span>
                        </div>
                        <div class="history-result-item">
                            <span class="value">${record.upload}</span>
                            <span class="label">上传(Mbps)</span>
                        </div>
                    </div>
                </div>
            `;
        });
        historyHTML += '</div>';

        historyContent.innerHTML = historyHTML;
    }

    // 加载服务器列表
    function loadServers() {
        const serversContent = document.getElementById('servers-content');
        serversContent.innerHTML = '<p>加载中...</p>';

        fetch('/servers')
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    displayServers(data.servers);
                } else {
                    throw new Error(data.error || "加载服务器列表失败");
                }
            })
            .catch(error => {
                console.error('加载服务器列表失败:', error);
                serversContent.innerHTML = '<p>加载服务器列表失败</p>';
            });
    }

    // 显示服务器列表
    function displayServers(servers) {
        const serversContent = document.getElementById('servers-content');

        if (!servers || servers.length === 0) {
            serversContent.innerHTML = '<p class="empty-message">暂无可用服务器</p>';
            return;
        }

        let serversHTML = '<div class="servers-list">';
        servers.forEach(server => {
            serversHTML += `
                <div class="server-item">
                    <div class="server-item-header">
                        <span>${server.name}</span>
                        <span>${server.sponsor}</span>
                    </div>
                    <div class="server-item-info">
                        <div class="server-info-item">
                            <span class="value">${server.country}</span>
                            <span class="label">国家</span>
                        </div>
                        <div class="server-info-item">
                            <span class="value">${server.location}</span>
                            <span class="label">位置</span>
                        </div>
                        <div class="server-info-item">
                            <span class="value">${server.latency || 'N/A'}</span>
                            <span class="label">延迟</span>
                        </div>
                    </div>
                </div>
            `;
        });
        serversHTML += '</div>';

        serversContent.innerHTML = serversHTML;
    }

    // 页面加载时获取最新测速结果
    fetch('/speedtest/latest')
        .then(response => response.json())
        .then(data => {
            if (data.status === "success" && data.result) {
                displayResult(data.result);
                resultsElement.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('获取最新测速结果失败:', error);
        });
});