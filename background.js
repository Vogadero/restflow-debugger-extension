// Background Service Worker
// 处理插件的后台逻辑

// 存储捕获的API请求
let capturedRequests = [];

// 创建右键菜单 - 在DevTools Network面板中使用
chrome.runtime.onInstalled.addListener(() => {
    // 由于Chrome扩展限制，无法直接在DevTools Network面板添加右键菜单
    // 用户需要手动复制请求为cURL格式，然后在RestFlow中导入
    console.log('RestFlow extension installed');
});

// 监听来自DevTools和Content Script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'NEW_API_REQUEST':
      handleNewApiRequest(message.data);
      break;
      
    case 'GET_CAPTURED_REQUESTS':
      sendResponse({ requests: capturedRequests });
      break;
      
    case 'REPLAY_REQUEST':
      replayRequest(message.data);
      break;
      
    case 'CLEAR_REQUESTS':
      capturedRequests = [];
      broadcastToDevTools({ type: 'REQUESTS_CLEARED' });
      break;
      
    case 'EXPORT_REQUESTS':
      exportRequests(sendResponse);
      return true; // 保持消息通道开放
      
    case 'IMPORT_REQUESTS':
      importRequests(message.data);
      break;
      
    case 'IMPORT_NETWORK_REQUEST':
      handleNetworkImport(message.data);
      break;
  }
});

// 处理新的API请求
function handleNewApiRequest(requestData) {
  // 添加唯一ID和时间戳
  const request = {
    id: generateId(),
    timestamp: Date.now(),
    ...requestData
  };
  
  capturedRequests.unshift(request); // 最新的在前面
  
  // 限制存储数量，避免内存溢出
  if (capturedRequests.length > 1000) {
    capturedRequests = capturedRequests.slice(0, 1000);
  }
  
  // 广播给所有DevTools面板
  broadcastToDevTools({
    type: 'REQUEST_ADDED',
    data: request
  });
  
  // 保存到本地存储
  saveRequestsToStorage();
}

// 重放请求
async function replayRequest(requestData) {
  try {
    // 准备请求选项
    const options = {
      method: requestData.method || 'GET'
    };
    
    // 处理请求头
    if (requestData.headers && typeof requestData.headers === 'object') {
      const headers = {};
      Object.entries(requestData.headers).forEach(([key, value]) => {
        // 跳过一些浏览器自动添加的头部
        const skipHeaders = ['host', 'content-length', 'connection', 'user-agent'];
        if (!skipHeaders.includes(key.toLowerCase())) {
          headers[key] = value;
        }
      });
      options.headers = headers;
    }
    
    // 处理请求体
    if (requestData.body && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
      options.body = requestData.body;
    }
    
    const startTime = Date.now();
    const response = await fetch(requestData.url, options);
    const endTime = Date.now();
    
    const responseText = await response.text();
    
    const responseData = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      duration: endTime - startTime
    };
    
    // 创建新的请求记录
    const replayedRequest = {
      id: generateId(),
      timestamp: startTime,
      url: requestData.url,
      method: requestData.method,
      headers: requestData.headers,
      body: requestData.body,
      response: responseData,
      duration: responseData.duration,
      isReplayed: true,
      originalId: requestData.id
    };
    
    // 添加到请求列表
    handleNewApiRequest(replayedRequest);
    
    // 广播重放结果
    broadcastToDevTools({
      type: 'REPLAY_SUCCESS',
      data: {
        originalId: requestData.id,
        newRequest: replayedRequest
      }
    });
    
  } catch (error) {
    console.error('重放请求失败:', error);
    broadcastToDevTools({
      type: 'REPLAY_ERROR',
      data: {
        originalId: requestData.id,
        error: error.message,
        timestamp: Date.now()
      }
    });
  }
}

// 广播消息给所有DevTools面板
function broadcastToDevTools(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // 忽略没有接收者的错误
  });
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 保存请求到本地存储
function saveRequestsToStorage() {
  chrome.storage.local.set({
    capturedRequests: capturedRequests.slice(0, 100) // 只保存最近100个
  });
}

// 从本地存储加载请求
function loadRequestsFromStorage() {
  chrome.storage.local.get(['capturedRequests'], (result) => {
    if (result.capturedRequests) {
      capturedRequests = result.capturedRequests;
    }
  });
}

// 导出请求数据
function exportRequests(sendResponse) {
  const exportData = {
    version: '1.0',
    timestamp: Date.now(),
    requests: capturedRequests
  };
  
  sendResponse({
    success: true,
    data: JSON.stringify(exportData, null, 2)
  });
}

// 处理Network面板导入
function handleNetworkImport(requestData) {
  const request = {
    id: generateId(),
    timestamp: Date.now(),
    isImported: true,
    ...requestData
  };
  
  capturedRequests.unshift(request);
  saveRequestsToStorage();
  broadcastToDevTools({ 
    type: 'REQUEST_ADDED',
    data: request
  });
}

// 导入请求数据
function importRequests(importData) {
  try {
    const data = JSON.parse(importData);
    if (data.requests && Array.isArray(data.requests)) {
      capturedRequests = [...data.requests, ...capturedRequests];
      saveRequestsToStorage();
      broadcastToDevTools({ type: 'REQUESTS_IMPORTED' });
    }
  } catch (error) {
    console.error('导入数据失败:', error);
  }
}

// 创建右键菜单
chrome.contextMenus.create({
  id: 'capture-request',
  title: '捕获此请求到API调试器',
  contexts: ['all']
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'capture-request') {
    // 注入脚本来捕获当前页面的请求
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: captureCurrentPageRequests
    });
  }
});

// 注入到页面的函数
function captureCurrentPageRequests() {
  // 这个函数会在页面上下文中执行
  console.log('开始捕获当前页面的请求...');
}

// 插件启动时加载存储的请求
loadRequestsFromStorage();
