// DevTools Network面板集成
// 这个脚本在DevTools环境中运行，可以访问Network API

class NetworkPanelIntegration {
    constructor() {
        this.setupNetworkListener();
        this.setupContextMenu();
    }
    
    setupNetworkListener() {
        // 监听网络请求完成事件
        if (chrome.devtools && chrome.devtools.network) {
            chrome.devtools.network.onRequestFinished.addListener((request) => {
                this.processNetworkRequest(request);
            });
        }
    }
    
    setupContextMenu() {
        // 在DevTools中添加右键菜单功能
        if (chrome.devtools && chrome.devtools.panels) {
            // 创建一个隐藏的面板来处理右键菜单
            chrome.devtools.panels.create(
                'RestFlow Network Helper',
                "icons/icon.svg",
                'network-helper.html',
                (panel) => {
                    // 面板创建成功
                    console.log('RestFlow Network Helper panel created');
                }
            );
        }
    }
    
    processNetworkRequest(request) {
        // 处理网络请求数据
        const requestData = this.convertHARToRestFlow(request);
        
        // 存储到本地，供右键菜单使用
        chrome.storage.local.set({
            [`network_${request._resourceType}_${Date.now()}`]: requestData
        });
    }
    
    convertHARToRestFlow(harRequest) {
        // 将HAR格式转换为RestFlow格式
        const request = harRequest.request;
        const response = harRequest.response;
        
        return {
            id: this.generateId(),
            method: request.method,
            url: request.url,
            timestamp: new Date(harRequest.startedDateTime).getTime(),
            isImported: true,
            source: 'network-panel',
            
            // 请求数据
            headers: this.convertHeaders(request.headers),
            body: request.postData ? request.postData.text : '',
            
            // 响应数据
            response: {
                status: response.status,
                statusText: response.statusText,
                headers: this.convertHeaders(response.headers),
                body: response.content ? response.content.text : '',
                size: response.bodySize,
                time: harRequest.time
            },
            
            // 额外信息
            duration: Math.round(harRequest.time),
            size: response.bodySize || 0,
            resourceType: harRequest._resourceType
        };
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
    
    // 导入选中的网络请求到RestFlow
    importSelectedRequest() {
        // 获取当前选中的网络请求
        chrome.storage.local.get(null, (items) => {
            const networkRequests = Object.keys(items)
                .filter(key => key.startsWith('network_'))
                .map(key => items[key])
                .sort((a, b) => b.timestamp - a.timestamp);
            
            if (networkRequests.length > 0) {
                const latestRequest = networkRequests[0];
                
                // 发送到RestFlow面板
                chrome.runtime.sendMessage({
                    type: 'IMPORT_NETWORK_REQUEST',
                    data: latestRequest
                });
                
                // 显示成功消息
                console.log('Network request imported to RestFlow:', latestRequest.url);
            }
        });
    }
    
    // 批量导入网络请求
    importAllRequests(filter = {}) {
        chrome.storage.local.get(null, (items) => {
            let networkRequests = Object.keys(items)
                .filter(key => key.startsWith('network_'))
                .map(key => items[key]);
            
            // 应用过滤器
            if (filter.method) {
                networkRequests = networkRequests.filter(req => 
                    req.method === filter.method
                );
            }
            
            if (filter.status) {
                networkRequests = networkRequests.filter(req => 
                    req.response && req.response.status.toString().startsWith(filter.status)
                );
            }
            
            if (filter.resourceType) {
                networkRequests = networkRequests.filter(req => 
                    req.resourceType === filter.resourceType
                );
            }
            
            // 批量导入
            networkRequests.forEach(request => {
                chrome.runtime.sendMessage({
                    type: 'IMPORT_NETWORK_REQUEST',
                    data: request
                });
            });
            
            console.log(`Imported ${networkRequests.length} network requests to RestFlow`);
        });
    }
    
    // 清理旧的网络请求数据
    cleanupOldRequests() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24小时前
        
        chrome.storage.local.get(null, (items) => {
            const keysToRemove = Object.keys(items)
                .filter(key => {
                    if (key.startsWith('network_')) {
                        const request = items[key];
                        return request.timestamp < cutoffTime;
                    }
                    return false;
                });
            
            if (keysToRemove.length > 0) {
                chrome.storage.local.remove(keysToRemove);
                console.log(`Cleaned up ${keysToRemove.length} old network requests`);
            }
        });
    }
}

// 初始化Network面板集成
if (typeof chrome !== 'undefined' && chrome.devtools) {
    const networkIntegration = new NetworkPanelIntegration();
    
    // 定期清理旧数据
    setInterval(() => {
        networkIntegration.cleanupOldRequests();
    }, 60 * 60 * 1000); // 每小时清理一次
    
    // 暴露到全局，供其他脚本使用
    window.RestFlowNetworkIntegration = networkIntegration;
}
