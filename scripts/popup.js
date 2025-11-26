// Popup页面逻辑
document.addEventListener('DOMContentLoaded', async () => {
    const requestCountEl = document.getElementById('requestCount');
    const todayCountEl = document.getElementById('todayCount');
    const openDevToolsBtn = document.getElementById('openDevTools');
    const clearDataBtn = document.getElementById('clearData');
    
    // 加载统计数据
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_CAPTURED_REQUESTS'
        });
        
        if (response && response.requests) {
            const requests = response.requests;
            requestCountEl.textContent = requests.length;
            
            // 计算今日捕获数量
            const today = new Date().toDateString();
            const todayRequests = requests.filter(req => 
                new Date(req.timestamp).toDateString() === today
            );
            todayCountEl.textContent = todayRequests.length;
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
    
    // 打开DevTools
    openDevToolsBtn.addEventListener('click', () => {
        alert('请按F12打开开发者工具，然后点击"RestFlow"标签页');
        window.close();
    });
    
    // 清空数据
    clearDataBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有捕获的请求数据吗？')) {
            chrome.runtime.sendMessage({ type: 'CLEAR_REQUESTS' });
            requestCountEl.textContent = '0';
            todayCountEl.textContent = '0';
            alert('数据已清空');
        }
    });
});
