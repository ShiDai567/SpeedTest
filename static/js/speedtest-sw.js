// /static/js/speedtest-sw.js
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // 检查是否为测速代理请求
    if (url.includes('/speedtest-proxy/')) {
        // 提取目标 URL
        const targetUrl = decodeURIComponent(url.split('/speedtest-proxy/')[1]);
        
        // 代理请求
        event.respondWith(
            fetch(targetUrl, {
                mode: 'cors',
                credentials: 'omit'
            }).catch(error => {
                console.error('SW proxy error:', error);
                return new Response('Proxy error', { status: 500 });
            })
        );
    }
});