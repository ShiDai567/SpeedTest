document.addEventListener('DOMContentLoaded', () => {
    // Element references
    const startBtn = document.getElementById('start-test-btn');
    const statusEl = document.querySelector('.container p'); // Using the paragraph for status
    const downloadSpeedEl = document.getElementById('download-result');
    const uploadSpeedEl = document.getElementById('upload-result');
    const pingValueEl = document.getElementById('ping-result');
    const speedDisplayEl = document.getElementById('speed-display');

    // Gauge setup
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
        limitMax: false,
        limitMin: false,
        colorStart: '#6FADCF',
        colorStop: '#8FC0DA',
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
    });
    gauge.maxValue = 100; // Set a default max speed in Mbps
    gauge.set(0);

    // Chart.js setup
    gauge.set(0);

    // Download Speed Chart setup
    const downloadSpeedCanvas = document.getElementById('download-speed-chart');
    const downloadSpeedChart = new Chart(downloadSpeedCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Download Speed (Mbps)',
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
                        text: 'Speed (Mbps)'
                    }
                }
            }
        }
    });

    // Upload Speed Chart setup
    const uploadSpeedCanvas = document.getElementById('upload-speed-chart');
    const uploadSpeedChart = new Chart(uploadSpeedCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Upload Speed (Mbps)',
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
                        text: 'Speed (Mbps)'
                    }
                }
            }
        }
    });

    const addPacketSpeedToChart = (chart, speed) => {
        const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(speed);

        // Limit to 50 data points for real-time view
        if(chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.update();
    };

    const updateGauge = (speed) => {
        // Dynamically adjust max value of gauge
        if (speed > gauge.maxValue) {
            gauge.maxValue = Math.ceil(speed / 10) * 10; 
        }
        gauge.set(speed);
        speedDisplayEl.textContent = `${speed.toFixed(2)} Mbps`;
    };

    const runTest = async () => {
        startBtn.disabled = true;
        statusEl.textContent = '正在准备测试...';
        downloadSpeedEl.textContent = '-';
        uploadSpeedEl.textContent = '-';
        pingValueEl.textContent = '-';
        updateGauge(0);
        // Clear download speed chart at the start of a new test
        downloadSpeedChart.data.labels = [];
        downloadSpeedChart.data.datasets[0].data = [];
        downloadSpeedChart.update();
        // Clear upload speed chart at the start of a new test
        uploadSpeedChart.data.labels = [];
        uploadSpeedChart.data.datasets[0].data = [];
        uploadSpeedChart.update();

        try {
            // 1. Ping Test
            statusEl.textContent = '正在测试延迟...';
            const ping = await testPing();
            pingValueEl.textContent = `${ping.toFixed(0)}`;

            // 2. Download Test
            statusEl.textContent = '正在测试下载速度...';
            const downloadSpeed = await testDownload((speed) => {
                downloadSpeedEl.textContent = speed.toFixed(2);
                updateGauge(speed);
                addPacketSpeedToChart(downloadSpeedChart, speed);
            });

            // 3. Upload Test
            statusEl.textContent = '正在测试上传速度...';
            const uploadSpeed = await testUpload((speed) => {
                uploadSpeedEl.textContent = speed.toFixed(2);
                updateGauge(speed);
                addPacketSpeedToChart(uploadSpeedChart, speed);
            });

            statusEl.textContent = '测试完成!';

            // Post results to backend
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

            // Refresh history table
            await updateHistoryTable();

        } catch (error) {
            console.error('Speed test failed:', error);
            statusEl.textContent = `测试失败: ${error.message}`;
            updateGauge(0);
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
            try {
                const startTime = Date.now();
                const response = await fetch(`/download?t=${startTime}`);
                const reader = response.body.getReader();
                let receivedLength = 0;
                let lastUpdate = startTime;
                let finalSpeed = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    receivedLength += value.length;

                    const now = Date.now();
                    const duration = (now - startTime) / 1000;
                    
                    if (duration > 0.25 && (now - lastUpdate > 250)) {
                        const speed = (receivedLength * 8) / duration / 1000000;
                        onProgress(speed);
                        lastUpdate = now;
                    }
                }
                
                const finalDuration = (Date.now() - startTime) / 1000;
                finalSpeed = (receivedLength * 8) / finalDuration / 1000000;
                onProgress(finalSpeed);
                resolve(finalSpeed);

            } catch (error) {
                reject(error);
            }
        });
    };

    const testUpload = (onProgress) => {
        return new Promise(async (resolve, reject) => {
            try {
                const uploadDuration = 10000; // 10 seconds
                const chunkSize = 1024 * 1024; // 1MB chunk
                const dummyData = new Uint8Array(chunkSize);
                let uploadedBytes = 0;
                const startTime = Date.now();
                let lastUpdate = startTime;

                while (Date.now() - startTime < uploadDuration) {
                    await fetch(`/upload?t=${Date.now()}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/octet-stream' },
                        body: dummyData,
                    });
                    uploadedBytes += chunkSize;

                    const now = Date.now();
                    if (now - lastUpdate > 250) {
                        const duration = (now - startTime) / 1000;
                        const speed = (uploadedBytes * 8) / duration / 1000000;
                        onProgress(speed);
                        lastUpdate = now;
                    }
                }

                const finalDuration = (Date.now() - startTime) / 1000;
                const finalSpeed = (uploadedBytes * 8) / finalDuration / 1000000;
                onProgress(finalSpeed);
                resolve(finalSpeed);

            } catch (error) {
                reject(error);
            }
        });
    };

    startBtn.addEventListener('click', runTest);

    // Function to fetch and update history table
    const updateHistoryTable = async () => {
        try {
            const response = await fetch('/history');
            const historyData = await response.json();
            const historyTableBody = document.querySelector('#history-table tbody');
            historyTableBody.innerHTML = ''; // Clear existing rows

            historyData.forEach(record => {
                const row = historyTableBody.insertRow();
                row.insertCell().textContent = record.timestamp;
                row.insertCell().textContent = record.ip;
                row.insertCell().textContent = `${record.ping.toFixed(2)} ms`;
                row.insertCell().textContent = `${record.download.toFixed(2)} Mbps`;
                row.insertCell().textContent = `${record.upload.toFixed(2)} Mbps`;
            });
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    // Initial load of history
    updateHistoryTable();
});