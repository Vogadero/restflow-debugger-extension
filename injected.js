// 注入到页面的脚本
// 拦截原生的fetch和XMLHttpRequest

(function() {
  'use strict';
  
  // 保存原始的fetch和XMLHttpRequest
  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest;
  
  // 用于去重的请求缓存
  const sentRequests = new Map();
  const DEDUP_WINDOW = 500; // 500毫秒内的相同请求视为重复
  
  // 生成请求的唯一标识
  function getRequestFingerprint(url, method, body, status) {
    // 使用URL、方法、请求体和状态码生成指纹
    const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const bodyHash = bodyStr.length > 100 ? bodyStr.substring(0, 100) : bodyStr;
    return `${method}:${url}:${bodyHash}:${status || 'pending'}`;
  }
  
  // 检查并记录请求
  function shouldSendRequest(url, method, body, status, timestamp) {
    const fingerprint = getRequestFingerprint(url, method, body, status);
    const cached = sentRequests.get(fingerprint);
    
    // 如果在去重窗口内已经发送过，跳过
    if (cached && (timestamp - cached) < DEDUP_WINDOW) {
      console.log('跳过重复请求:', method, url);
      return false;
    }
    
    sentRequests.set(fingerprint, timestamp);
    
    // 清理过期的缓存
    if (sentRequests.size > 200) {
      const now = Date.now();
      for (const [key, time] of sentRequests.entries()) {
        if (now - time > 2000) {
          sentRequests.delete(key);
        }
      }
    }
    
    return true;
  }
  
  // 拦截fetch请求
  window.fetch = function(...args) {
    const startTime = Date.now();
    
    // 解析请求信息
    const request = args[0];
    const options = args[1] || {};
    const url = typeof request === 'string' ? request : request.url;
    const method = options.method || 'GET';
    
    return originalFetch.apply(this, args).then(response => {
      const endTime = Date.now();
      
      // 克隆响应以避免消费
      const clonedResponse = response.clone();
      
      const requestData = {
        url: url,
        method: method,
        headers: options.headers || {},
        body: options.body,
        timestamp: startTime,
        duration: endTime - startTime
      };
      
      // 异步处理响应数据
      clonedResponse.text().then(responseText => {
        // 检查是否应该发送（去重）
        if (!shouldSendRequest(url, method, options.body, response.status, endTime)) {
          return;
        }
        
        // 尝试解析JSON
        let parsedBody = responseText;
        try {
          parsedBody = JSON.parse(responseText);
        } catch (e) {
          // 不是JSON，保持原样
        }
        
        const responseData = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedBody,
          url: response.url
        };
        
        // 发送拦截的请求数据
        window.postMessage({
          type: 'API_REQUEST_INTERCEPTED',
          request: {
            ...requestData,
            response: responseData
          }
        }, '*');
      }).catch(console.error);
      
      return response;
    });
  };
  
  // 拦截XMLHttpRequest
  const XHRProto = originalXHR.prototype;
  const originalOpen = XHRProto.open;
  const originalSend = XHRProto.send;
  const originalSetRequestHeader = XHRProto.setRequestHeader;
  
  XHRProto.open = function(method, url, async, user, password) {
    this._requestData = {
      method: method,
      url: url,
      headers: {},
      startTime: Date.now()
    };
    
    return originalOpen.apply(this, arguments);
  };
  
  XHRProto.setRequestHeader = function(header, value) {
    if (this._requestData) {
      this._requestData.headers[header] = value;
    }
    return originalSetRequestHeader.apply(this, arguments);
  };
  
  XHRProto.send = function(body) {
    if (this._requestData) {
      this._requestData.body = body;
      this._requestData.startTime = Date.now();
      
      // 监听响应
      const originalOnReadyStateChange = this.onreadystatechange;
      this.onreadystatechange = function() {
        if (this.readyState === 4) {
          const endTime = Date.now();
          
          // 检查是否应该发送（去重）
          if (!shouldSendRequest(
            this._requestData.url, 
            this._requestData.method, 
            this._requestData.body,
            this.status,
            endTime
          )) {
            if (originalOnReadyStateChange) {
              originalOnReadyStateChange.apply(this, arguments);
            }
            return;
          }
          
          // 尝试解析JSON响应
          let parsedBody = this.responseText;
          try {
            parsedBody = JSON.parse(this.responseText);
          } catch (e) {
            // 不是JSON，保持原样
          }
          
          const responseData = {
            status: this.status,
            statusText: this.statusText,
            headers: parseResponseHeaders(this.getAllResponseHeaders()),
            body: parsedBody,
            url: this.responseURL || this._requestData.url
          };
          
          // 发送拦截的请求数据
          window.postMessage({
            type: 'API_REQUEST_INTERCEPTED',
            request: {
              ...this._requestData,
              duration: endTime - this._requestData.startTime,
              response: responseData
            }
          }, '*');
        }
        
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(this, arguments);
        }
      };
    }
    
    return originalSend.apply(this, arguments);
  };
  
  // 解析响应头
  function parseResponseHeaders(headerStr) {
    const headers = {};
    if (!headerStr) return headers;
    
    headerStr.split('\r\n').forEach(line => {
      const parts = line.split(': ');
      if (parts.length === 2) {
        headers[parts[0]] = parts[1];
      }
    });
    
    return headers;
  }
  
  // 监听来自content script的消息
  window.addEventListener('message', (event) => {
    if (event.data.type === 'EXECUTE_REQUEST_IN_PAGE') {
      executeRequestInPage(event.data.data);
    }
  });
  
  // 在页面上下文中执行请求
  function executeRequestInPage(requestData) {
    const { url, method, headers, body } = requestData;
    
    fetch(url, {
      method: method,
      headers: headers,
      body: body
    }).then(response => {
      return response.text().then(text => ({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text
      }));
    }).then(responseData => {
      window.postMessage({
        type: 'REQUEST_EXECUTED',
        data: {
          request: requestData,
          response: responseData,
          timestamp: Date.now()
        }
      }, '*');
    }).catch(error => {
      window.postMessage({
        type: 'REQUEST_ERROR',
        data: {
          request: requestData,
          error: error.message,
          timestamp: Date.now()
        }
      }, '*');
    });
  }
  
  console.log('API Debugger: 请求拦截器已注入');
})();
