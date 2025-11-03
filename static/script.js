document.addEventListener('DOMContentLoaded', () => {
    // 元素引用
    const startBtn = document.getElementById('start-test-btn');
    const statusEl = document.querySelector('.container p'); // 使用段落作为状态显示
    const downloadSpeedEl = document.getElementById('download-result');
    const uploadSpeedEl = document.getElementById('upload-result');
    const pingValueEl = document.getElementById('ping-result');
    const speedDisplayEl = document.getElementById('speed-display');

    // 仪表盘设置
    const gaugeCanvas = document.getElementById('speed-gauge');
    const gauge = new Gauge(gaugeCanvas).setOptions({
        angle: -0.2,
        lineWidth: 0.2,
        radiusScale: 1,
        pointer: {
            length: 0.6,
            strokeWidth: 0.035,
            color: '#000000'
        },
        limitMin: false,
        colorStart: '#6FADCF',
        colorStop: '#8FC0DA',
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
    });
    gauge.maxValue = 100; // 设置默认的最大速度 (Mbps)
    gauge.set(0);

    // Chart.js 设置
    gauge.set(0);

    // 下载速度图表设置
    const downloadSpeedCanvas = document.getElementById('download-speed-chart');
    const downloadSpeedChart = new Chart(downloadSpeedCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: '下载速度 (Mbps)',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            animation: false,
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '速度 (Mbps)'
                    }
                }
            }
        }
    });

    // 上传速度图表设置
    const uploadSpeedCanvas = document.getElementById('upload-speed-chart');
    const uploadSpeedChart = new Chart(uploadSpeedCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: '上传速度 (Mbps)',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            animation: false,
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '速度 (Mbps)'
                    }
                }
            }
        }
    });

    const addPacketSpeedToChart = (chart, speed) => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(speed);

        // 限制实时视图最多50个数据点
        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.update();
    };

    const updateGauge = (speed) => {
        // 限制显示的最大速度值，避免显示过大数值导致布局问题
        const maxDisplaySpeed = 9999.99;
        const displaySpeed = speed > maxDisplaySpeed ? maxDisplaySpeed : speed;

        // 动态调整仪表盘的最大值
        if (displaySpeed > gauge.maxValue) {
            gauge.maxValue = Math.ceil(displaySpeed / 10) * 10;
        }
        gauge.set(displaySpeed);

        // 格式化显示，当数值过大时显示为"Gbps"
        if (displaySpeed >= 1000) {
            const gbpsValue = (displaySpeed / 1000).toFixed(2);
            speedDisplayEl.textContent = `${gbpsValue} Gbps`;
        } else {
            speedDisplayEl.textContent = `${displaySpeed.toFixed(2)} Mbps`;
        }
    };

    // 设置仪表盘颜色
    const setGaugeColor = (testType) => {
        // 保存当前的数值
        const currentValue = gauge.displayedValue || 0;

        // 根据测试类型设置不同颜色
        let options = {
            angle: -0.2,
            lineWidth: 0.2,
            radiusScale: 1,
            pointer: {
                length: 0.6,
                strokeWidth: 0.035,
                color: '#000000'
            },
            limitMin: false,
            strokeColor: '#E0E0E0',
            generateGradient: true,
            highDpiSupport: true,
        };

        switch (testType) {
            case 'download':
                // 蓝色调 - 下载测试
                options.colorStart = '#6FADCF';
                options.colorStop = '#8FC0DA';
                break;
            case 'upload':
                // 红色调 - 上传测试
                options.colorStart = '#FF6B6B';
                options.colorStop = '#FF8E8E';
                break;
            case 'default':
            default:
                // 默认颜色(测试前和测试后)
                options.colorStart = '#6FADCF';
                options.colorStop = '#8FC0DA';
                break;
        }

        // 更新仪表盘配置
        gauge.setOptions(options);
        // 恢复之前的数值
        gauge.set(currentValue);
    };

    const runTest = async () => {
        startBtn.disabled = true;
        statusEl.textContent = '正在准备测试...';
        downloadSpeedEl.textContent = '-';
        uploadSpeedEl.textContent = '-';
        pingValueEl.textContent = '-';
        updateGauge(0);
        setGaugeColor('default'); // 设置默认颜色

        // 在新测试开始时清除下载速度图表
        downloadSpeedChart.data.labels = [];
        downloadSpeedChart.data.datasets[0].data = [];
        downloadSpeedChart.update();
        // 在新测试开始时清除上传速度图表
        uploadSpeedChart.data.labels = [];
        uploadSpeedChart.data.datasets[0].data = [];
        uploadSpeedChart.update();

        try {
            // 1. Ping 测试
            statusEl.textContent = '正在测试延迟...';
            const ping = await testPing();
            pingValueEl.textContent = `${ping.toFixed(0)}`;

            // 2. 下载测试
            statusEl.textContent = '正在测试下载速度...';
            setGaugeColor('download'); // 设置下载测试颜色
            const downloadSpeed = await testDownload((speed) => {
                downloadSpeedEl.textContent = speed.toFixed(2);
                updateGauge(speed);
                addPacketSpeedToChart(downloadSpeedChart, speed);
            });

            // 下载测试完成后重置仪表盘
            statusEl.textContent = '正在准备上传测试...';
            updateGauge(0);
            // setGaugeColor('default'); // 重置为默认颜色
            await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms让用户看到指针复位

            // 3. 上传测试
            statusEl.textContent = '正在测试上传速度...';
            setGaugeColor('upload'); // 设置上传测试颜色
            const uploadSpeed = await testUpload((speed) => {
                uploadSpeedEl.textContent = speed.toFixed(2);
                updateGauge(speed);
                addPacketSpeedToChart(uploadSpeedChart, speed);
            });

            // 上传测试完成后重置仪表盘
            statusEl.textContent = '正在完成测试...';
            updateGauge(0);
            // setGaugeColor('default'); // 重置为默认颜色
            await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms让用户看到指针复位

            statusEl.textContent = '测试完成!';

            // 将结果发送到后端
            const results = {
                ping: ping,
                download: downloadSpeed,
                upload: uploadSpeed
            };

            await fetch('/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results)
            });

            // 刷新历史记录表
            await updateHistoryTable();

        } catch (error) {
            console.error('Speed test failed:', error);
            statusEl.textContent = `测试失败: ${error.message}`;
            updateGauge(0);
            // setGaugeColor('default'); // 出错时也恢复默认颜色
        } finally {
            startBtn.disabled = false;
        }
    };

    const testPing = async () => {
        const startTime = Date.now();
        await fetch(`/ping?t=${startTime}`);
        return Date.now() - startTime;
    };

    const testDownload = (onProgress) => {
        return new Promise(async (resolve, reject) => {
            const controller = new AbortController();
            const signal = controller.signal;
            const downloadTimeout = 5000; // 5秒

            const timeoutId = setTimeout(() => {
                controller.abort();
                console.log('下载测试超时。');
            }, downloadTimeout);

            let receivedLength = 0;
            let speeds = []; // 存储所有速度值用于计算平均值
            const startTime = Date.now();

            try {
                const response = await fetch(`/download?t=${startTime}`, { signal });
                const reader = response.body.getReader();
                let lastUpdate = startTime;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    receivedLength += value.length;

                    const now = Date.now();
                    const duration = (now - startTime) / 1000;

                    if (duration > 0.25 && (now - lastUpdate > 250)) {
                        const speed = (receivedLength * 8) / duration / 1000000;
                        speeds.push(speed); // 收集速度值
                        onProgress(speed);
                        lastUpdate = now;
                    }
                }

                clearTimeout(timeoutId);

                const finalDuration = (Date.now() - startTime) / 1000;
                // 使用收集到的速度值计算平均速度，排除最高和最低值
                if (speeds.length > 2) {
                    speeds.sort((a, b) => a - b);
                    speeds.pop(); // 移除最大值
                    speeds.shift(); // 移除最小值
                }

                // 计算平均速度
                const avgSpeed = speeds.length > 0
                    ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
                    : (receivedLength * 8) / finalDuration / 1000000;

                onProgress(avgSpeed);
                resolve(avgSpeed);

            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    const finalDuration = (Date.now() - startTime) / 1000;
                    if (speeds.length > 2) {
                        speeds.sort((a, b) => a - b);
                        speeds.pop();
                        speeds.shift();
                    }
                    const avgSpeed = speeds.length > 0
                        ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
                        : (receivedLength * 8) / finalDuration / 1000000;
                    onProgress(avgSpeed);
                    resolve(avgSpeed);
                } else {
                    reject(error);
                }
            }
        });
    };

    const testUpload = (onProgress) => {
        return new Promise(async (resolve, reject) => {
            try {
                // 增加测试时间以获得更稳定的结果
                const uploadDuration = 5000; // 5秒
                const chunkSize = 1 * 1024 * 1024; // 1MB 数据块
                const dummyData = new Uint8Array(chunkSize);
                let uploadedBytes = 0;
                const startTime = Date.now();
                let lastUpdate = startTime;
                let speeds = []; // 存储所有速度值用于计算平均值

                // 连续发送数据而不是等待每个请求完成
                const sendChunk = () => {
                    return fetch(`/upload?t=${Date.now()}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/octet-stream' },
                        body: dummyData,
                    });
                };

                const promises = [];
                while (Date.now() - startTime < uploadDuration) {
                    // 并行发送多个请求以更好地利用带宽
                    promises.push(sendChunk());
                    uploadedBytes += chunkSize;

                    const now = Date.now();
                    if (now - lastUpdate > 250) {
                        const duration = (now - startTime) / 1000;
                        const speed = (uploadedBytes * 8) / duration / 1000000;
                        speeds.push(speed);
                        onProgress(speed);
                        lastUpdate = now;
                    }

                    // 控制并发请求数量，避免过多请求导致阻塞
                    if (promises.length >= 5) {
                        await Promise.all(promises.splice(0, 2));
                    }
                }

                // 等待剩余的请求完成
                await Promise.all(promises);

                const finalDuration = (Date.now() - startTime) / 1000;

                // 使用收集到的速度值计算平均速度，排除最高和最低值
                if (speeds.length > 2) {
                    speeds.sort((a, b) => a - b);
                    speeds.pop(); // 移除最大值
                    speeds.shift(); // 移除最小值
                }

                // 计算平均速度
                const avgSpeed = speeds.length > 0
                    ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
                    : (uploadedBytes * 8) / finalDuration / 1000000;

                onProgress(avgSpeed);
                resolve(avgSpeed);

            } catch (error) {
                reject(error);
            }
        });
    };

    startBtn.addEventListener('click', runTest);

    // 获取并更新历史记录表的函数
    const updateHistoryTable = async () => {
        try {
            const response = await fetch('/history');
            const historyData = await response.json();
            const historyTableBody = document.querySelector('#history-table tbody');
            historyTableBody.innerHTML = ''; // 清除现有行

            historyData.forEach(record => {
                const row = historyTableBody.insertRow();
                row.insertCell().textContent = record.timestamp;
                row.insertCell().textContent = record.ip;
                row.insertCell().textContent = `${record.ping.toFixed(2)} ms`;
                row.insertCell().textContent = `${record.download.toFixed(2)} Mbps`;
                row.insertCell().textContent = `${record.upload.toFixed(2)} Mbps`;
            });
        } catch (error) {
            console.error('获取历史记录失败:', error);
        }
    };

    // 初始加载历史记录
    updateHistoryTable();
});