// DevTools 入口文件
// 创建自定义面板
chrome.devtools.panels.create(
  'RestFlow',
  "icons/icon.svg",
  'panel.html',
  (panel) => {
    console.log('RestFlow panel created');
    
    console.log('RestFlow面板已创建');
    
    // 面板显示时的回调
    panel.onShown.addListener((window) => {
      console.log('API调试器面板已显示');
    });
    
    // 面板隐藏时的回调
    panel.onHidden.addListener(() => {
      console.log('API调试器面板已隐藏');
    });
  }
);

// 监听网络请求
chrome.devtools.network.onRequestFinished.addListener((request) => {
  // 过滤API请求（排除静态资源）
  if (isApiRequest(request)) {
    // 发送请求信息到面板
    chrome.runtime.sendMessage({
      type: 'NEW_API_REQUEST',
      data: {
        url: request.request.url,
        method: request.request.method,
        headers: request.request.headers,
        postData: request.request.postData,
        response: {
          status: request.response.status,
          statusText: request.response.statusText,
          headers: request.response.headers,
          content: request.response.content
        },
        time: request.time,
        startedDateTime: request.startedDateTime
      }
    });
  }
});

// 判断是否为API请求
function isApiRequest(request) {
  const url = request.request.url;
  const contentType = request.response.headers.find(h => 
    h.name.toLowerCase() === 'content-type'
  );
  
  // 排除静态资源
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  const hasStaticExtension = staticExtensions.some(ext => url.includes(ext));
  
  // 包含API相关的URL或返回JSON数据
  const isApiUrl = url.includes('/api/') || 
                   url.includes('/v1/') || 
                   url.includes('/v2/') ||
                   (contentType && contentType.value.includes('application/json'));
  
  return !hasStaticExtension && (isApiUrl || request.request.method !== 'GET');
}
