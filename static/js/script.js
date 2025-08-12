document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('start-test');
    const retryButton = document.getElementById('retry-button');
    const loadingElement = document.getElementById('loading');
    const resultsElement = document.getElementById('results');
    const errorElement = document.getElementById('error');
    const downloadSpeedElement = document.getElementById('download-speed');
    const uploadSpeedElement = document.getElementById('upload-speed');
    const pingElement = document.getElementById('ping');
    const serverNameElement = document.getElementById('server-name');
    const serverLocationElement = document.getElementById('server-location');
    const loadingStepElement = document.getElementById('loading-step');
    const errorMessageElement = document.getElementById('error-message');
    const progressBar = document.querySelector('.progress-fill');

    startButton.addEventListener('click', runSpeedTest);
    retryButton.addEventListener('click', runSpeedTest);

    function runSpeedTest() {
        // 重置界面
        hideAll();
        loadingElement.classList.remove('hidden');
        startButton.disabled = true;
        progressBar.style.width = '10%';
        loadingStepElement.textContent = '初始化测速服务...';

        // 模拟进度条动画
        let progress = 10;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress >= 90) progress = 90;
            progressBar.style.width = `${progress}%`;
        }, 500);

        // 发送测速请求
        fetch('/api/speedtest')
            .then(response => response.json())
            .then(data => {
                clearInterval(progressInterval);
                progressBar.style.width = '100%';

                loadingStepElement.textContent = '处理结果...';

                setTimeout(() => {
                    loadingElement.classList.add('hidden');

                    if (data.success) {
                        // 显示结果
                        downloadSpeedElement.textContent = data.download || '-';
                        uploadSpeedElement.textContent = data.upload || '-';
                        pingElement.textContent = data.ping || '-';

                        if (data.server) {
                            serverNameElement.textContent = data.server;
                        } else {
                            serverNameElement.textContent = '未知';
                        }

                        if (data.sponsor && data.country) {
                            serverLocationElement.textContent = `${data.sponsor}, ${data.country}`;
                        } else {
                            serverLocationElement.textContent = '未知位置';
                        }

                        resultsElement.classList.remove('hidden');
                    } else {
                        // 显示错误
                        errorMessageElement.textContent = data.error || '测速失败，请稍后重试';
                        errorElement.classList.remove('hidden');
                    }
                }, 500);
            })
            .catch(error => {
                console.error('测速错误:', error);
                clearInterval(progressInterval);
                loadingElement.classList.add('hidden');
                errorMessageElement.textContent = '网络连接错误，请检查您的网络后重试';
                errorElement.classList.remove('hidden');
            })
            .finally(() => {
                startButton.disabled = false;
            });
    }

    function hideAll() {
        loadingElement.classList.add('hidden');
        resultsElement.classList.add('hidden');
        errorElement.classList.add('hidden');
    }
});