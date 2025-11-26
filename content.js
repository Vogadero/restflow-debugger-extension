// Content Script
// 在页面上下文中运行，负责拦截网络请求

// 注入脚本到页面
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// 监听来自注入脚本的消息
window.addEventListener('message', (event) => {
  // 只处理来自同一窗口的消息
  if (event.source !== window) return;
  
  if (event.data.type === 'API_REQUEST_INTERCEPTED') {
    // 转发给background script
    chrome.runtime.sendMessage({
      type: 'NEW_API_REQUEST',
      data: event.data.request
    });
  }
});

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXECUTE_REQUEST') {
    // 在页面上下文中执行请求
    window.postMessage({
      type: 'EXECUTE_REQUEST_IN_PAGE',
      data: message.data
    }, '*');
  }
});
