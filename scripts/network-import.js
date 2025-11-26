// Network面板右键导入功能

// 创建右键菜单项
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'import-to-restflow',
        title: '导入到RestFlow',
        contexts: ['all'],
        documentUrlPatterns: ['chrome-devtools://*/*']
    });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'import-to-restflow') {
        // 注入脚本到DevTools页面
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractNetworkRequest
        });
    }
});

// 提取Network请求的函数
function extractNetworkRequest() {
    // 尝试从DevTools Network面板获取选中的请求
    const selectedRequest = getSelectedNetworkRequest();
    
    if (selectedRequest) {
        // 发送到RestFlow面板
        chrome.runtime.sendMessage({
            type: 'IMPORT_NETWORK_REQUEST',
            data: selectedRequest
        });
    } else {
        console.log('未找到选中的网络请求');
    }
}

// 获取选中的网络请求（这需要访问DevTools的内部API）
function getSelectedNetworkRequest() {
    try {
        // 这是一个简化的实现，实际需要更复杂的DevTools API集成
        const networkPanel = document.querySelector('.network-log-grid');
        const selectedRow = networkPanel?.querySelector('.selected');
        
        if (selectedRow) {
            // 提取请求信息
            const method = selectedRow.querySelector('.method-column')?.textContent;
            const url = selectedRow.querySelector('.name-column')?.textContent;
            const status = selectedRow.querySelector('.status-column')?.textContent;
            
            return {
                id: Date.now().toString(),
                method: method || 'GET',
                url: url || '',
                status: parseInt(status) || 0,
                timestamp: Date.now(),
                isImported: true,
                headers: {},
                body: '',
                response: {
                    status: parseInt(status) || 0,
                    headers: {},
                    body: ''
                }
            };
        }
    } catch (error) {
        console.error('提取网络请求失败:', error);
    }
    
    return null;
}

// 更高级的DevTools集成方法
class NetworkImporter {
    constructor() {
        this.setupDevToolsIntegration();
    }
    
    setupDevToolsIntegration() {
        // 监听DevTools的网络事件
        if (typeof chrome !== 'undefined' && chrome.devtools) {
            chrome.devtools.network.onRequestFinished.addListener((request) => {
                // 存储请求以供后续导入
                this.storeNetworkRequest(request);
            });
        }
    }
    
    storeNetworkRequest(request) {
        const requestData = {
            id: this.generateId(),
            method: request.request.method,
            url: request.request.url,
            timestamp: Date.parse(request.startedDateTime),
            isImported: true,
            headers: this.convertHeaders(request.request.headers),
            body: request.request.postData?.text || '',
            response: {
                status: request.response.status,
                statusText: request.response.statusText,
                headers: this.convertHeaders(request.response.headers),
                body: request.response.content?.text || ''
            }
        };
        
        // 存储到本地，供右键菜单使用
        chrome.storage.local.set({
            [`network_request_${request.id}`]: requestData
        });
    }
    
    convertHeaders(headers) {
        const result = {};
        if (Array.isArray(headers)) {
            headers.forEach(header => {
                result[header.name] = header.value;
            });
        }
        return result;
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// 初始化Network导入器
if (typeof chrome !== 'undefined' && chrome.devtools) {
    new NetworkImporter();
}
