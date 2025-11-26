// DevTools面板主要逻辑
class ApiDebuggerPanel {
    constructor() {
        this.requests = [];
        this.selectedRequest = null;
        this.filteredRequests = [];
        this.selectionManager = new SelectionManager();
        
        this.initializeElements();
        this.bindEvents();
        this.loadRequests();
        this.initializeUI();
    }
    
    initializeElements() {
        // 顶部导航元素
        this.newRequestBtn = document.getElementById('newRequestBtn');
        this.importCurlBtn = document.getElementById('importCurlBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.clearListBtn = document.getElementById('clearListBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        
        // 搜索和过滤元素
        this.searchInput = document.getElementById('searchInput');
        this.searchClearBtn = document.getElementById('searchClearBtn');
        this.methodFilter = document.getElementById('methodFilter');
        this.statusFilter = document.getElementById('statusFilter');
        this.typeFilter = document.getElementById('typeFilter');
        
        // 主要内容元素
        this.requestsList = document.getElementById('requestsList');
        this.detailsContent = document.getElementById('detailsContent');
        this.requestCount = document.getElementById('requestCount');
        
        // 操作按钮
        this.refreshBtn = document.getElementById('refreshBtn');
        this.duplicateBtn = document.getElementById('duplicateBtn');
        this.replayBtn = document.getElementById('replayBtn');
        this.editBtn = document.getElementById('editBtn');
        
        // 编辑模态框元素
        this.editModal = document.getElementById('editModal');
        this.closeModal = document.getElementById('closeModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.editMethod = document.getElementById('editMethod');
        this.editUrl = document.getElementById('editUrl');
        this.sendRequest = document.getElementById('sendRequest');
        this.cancelEdit = document.getElementById('cancelEdit');
        this.saveRequest = document.getElementById('saveRequest');
        
        // cURL模态框元素
        this.curlModal = document.getElementById('curlModal');
        this.closeCurlModalBtn = document.getElementById('closeCurlModal');
        this.curlInput = document.getElementById('curlInput');
        this.cancelCurl = document.getElementById('cancelCurl');
        this.importCurl = document.getElementById('importCurl');
        
        // 代码生成器元素
        this.codeModal = document.getElementById('codeGeneratorModal');
        this.closeCodeModal = document.getElementById('closeCodeModal');
        this.codeLanguage = document.getElementById('codeLanguage');
        this.generatedCode = document.getElementById('generatedCode');
        this.formatCode = document.getElementById('formatCode');
        this.copyCode = document.getElementById('copyCode');
        this.downloadCode = document.getElementById('downloadCode');
        
        // 编辑表单元素
        this.editHeaders = document.getElementById('editHeadersRaw');
        this.editBody = document.getElementById('editBodyJson');
        
        // Tab元素
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
    }
    
    bindEvents() {
        // 顶部导航事件
        this.newRequestBtn.addEventListener('click', () => this.newRequest());
        this.importCurlBtn.addEventListener('click', () => this.openCurlModal());
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearRequests());
        }
        if (this.clearListBtn) {
            this.clearListBtn.addEventListener('click', () => this.clearRequestsList());
        }
        this.exportBtn.addEventListener('click', () => this.exportRequests());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.importRequests(e));
        
        // 搜索和过滤
        this.searchInput.addEventListener('input', () => {
            this.toggleSearchClearBtn();
            this.filterRequests();
        });
        this.searchClearBtn.addEventListener('click', () => this.clearSearch());
        this.methodFilter.addEventListener('change', () => this.filterRequests());
        this.statusFilter.addEventListener('change', () => this.filterRequests());
        this.typeFilter.addEventListener('change', () => this.filterRequests());
        
        // 操作按钮
        this.refreshBtn.addEventListener('click', () => this.refreshPage());
        this.duplicateBtn.addEventListener('click', (e) => this.showCopyMenu(e));
        this.replayBtn.addEventListener('click', () => this.replayRequest());
        this.editBtn.addEventListener('click', () => this.editRequest());
        
        // 编辑模态框事件
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.cancelEdit.addEventListener('click', () => this.closeEditModal());
        this.sendRequest.addEventListener('click', () => this.sendEditedRequest());
        this.saveRequest.addEventListener('click', () => this.saveEditedRequest());
        
        // cURL模态框事件
        this.closeCurlModalBtn.addEventListener('click', () => this.closeCurlModal());
        this.cancelCurl.addEventListener('click', () => this.closeCurlModal());
        this.importCurl.addEventListener('click', () => this.importCurlCommand());
        
        // 代码生成器事件
        this.closeCodeModal.addEventListener('click', () => this.closeCodeGenerator());
        this.codeLanguage.addEventListener('change', () => this.generateCode());
        this.copyCode.addEventListener('click', () => this.copyGeneratedCode());
        this.downloadCode.addEventListener('click', () => this.downloadGeneratedCode());
        this.formatCode.addEventListener('click', () => this.formatGeneratedCode());
        
        // 复制按钮事件
        document.getElementById('copyHeadersBtn')?.addEventListener('click', () => this.copyHeaders());
        document.getElementById('copyBodyBtn')?.addEventListener('click', () => this.copyBody());
        
        // 下拉菜单事件 - 优化处理
        this.initializeDropdowns();
        
        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
        
        // Tab切换事件
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.closest('.tab-btn').getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
        
        // 请求头模式切换事件
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.closest('.toggle-btn').getAttribute('data-mode');
                this.switchHeadersMode(mode);
            });
        });
        
        // 请求体类型切换事件
        document.getElementById('bodyType')?.addEventListener('change', (e) => {
            this.updateBodyTypeIndicator(e.target.value);
        });
        
        // 点击模态框外部关闭
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
        
        // 监听来自background的消息
        chrome.runtime.onMessage.addListener((message) => {
            this.handleBackgroundMessage(message);
        });
    }
    
    handleBackgroundMessage(message) {
        switch (message.type) {
            case 'REQUEST_ADDED':
                this.addRequest(message.data);
                break;
            case 'REQUESTS_CLEARED':
                this.requests = [];
                this.updateUI();
                break;
            case 'REPLAY_SUCCESS':
                this.handleReplaySuccess(message.data);
                break;
            case 'REPLAY_ERROR':
                this.handleReplayError(message.data);
                break;
            case 'REQUESTS_IMPORTED':
                this.loadRequests();
                break;
        }
    }
    
    async loadRequests() {
        // 保存当前选中的请求ID
        const selectedId = this.selectedRequest ? this.selectedRequest.id : null;
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_CAPTURED_REQUESTS'
            });
            
            if (response && response.requests) {
                this.requests = response.requests;
                this.updateUI();
                
                // 尝试恢复选中状态
                if (selectedId) {
                    const stillExists = this.requests.find(r => r.id === selectedId);
                    if (stillExists) {
                        this.selectRequest(stillExists);
                    }
                }
            }
        } catch (error) {
            console.error('加载请求失败:', error);
            this.showNotification('刷新失败: ' + error.message, 'error');
        }
    }
    
    // 刷新页面功能
    async refreshPage() {
        // 添加加载动画
        if (this.refreshBtn) {
            this.refreshBtn.classList.add('rotating');
            this.refreshBtn.disabled = true;
        }
        
        try {
            // 清空当前请求列表
            this.requests = [];
            this.selectedRequest = null;
            this.updateUI();
            this.detailsContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👆</div>
                    <p>选择一个请求查看详情</p>
                </div>
            `;
            this.replayBtn.disabled = true;
            this.editBtn.disabled = true;
            this.duplicateBtn.disabled = true;
            
            // 清空background中的请求
            await chrome.runtime.sendMessage({ type: 'CLEAR_REQUESTS' });
            
            // 在DevTools中重新加载inspected window
            if (chrome.devtools && chrome.devtools.inspectedWindow) {
                chrome.devtools.inspectedWindow.reload();
                this.showNotification('页面已重新加载，正在捕获新请求...', 'success');
                
                // 页面重新加载后，自动开始捕获新的请求
                // 等待一小段时间让页面开始加载
                setTimeout(() => {
                    this.loadRequests();
                }, 1000);
            } else {
                // 备用方案：使用tabs API
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs && tabs[0]) {
                    await chrome.tabs.reload(tabs[0].id);
                    this.showNotification('页面已重新加载，正在捕获新请求...', 'success');
                    
                    // 页面重新加载后，自动开始捕获新的请求
                    setTimeout(() => {
                        this.loadRequests();
                    }, 1000);
                } else {
                    this.showNotification('无法重新加载页面', 'error');
                }
            }
        } catch (error) {
            console.error('刷新页面失败:', error);
            this.showNotification('刷新失败: ' + error.message, 'error');
        } finally {
            // 移除加载动画（延迟移除，让用户看到正在加载）
            setTimeout(() => {
                if (this.refreshBtn) {
                    this.refreshBtn.classList.remove('rotating');
                    this.refreshBtn.disabled = false;
                }
            }, 2000);
        }
    }
    
    addRequest(request) {
        // 只添加有响应的请求（有耗时说明请求已完成）
        if (!request.response || !request.duration) {
            console.log('跳过未完成的请求:', request.url);
            return;
        }
        
        // 检查是否已存在相同的请求（去重）
        const isDuplicate = this.requests.some(r => 
            r.url === request.url && 
            r.method === request.method && 
            Math.abs(r.timestamp - request.timestamp) < 500 // 500ms内的相同请求视为重复
        );
        
        if (isDuplicate) {
            console.log('跳过重复请求:', request.url);
            return;
        }
        
        this.requests.unshift(request);
        
        // 限制显示数量
        if (this.requests.length > 1000) {
            this.requests = this.requests.slice(0, 1000);
        }
        
        this.updateUI();
    }
    
    // 切换搜索清空按钮显示
    toggleSearchClearBtn() {
        if (this.searchClearBtn) {
            this.searchClearBtn.style.display = this.searchInput.value ? 'flex' : 'none';
        }
    }
    
    // 清空搜索
    clearSearch() {
        this.searchInput.value = '';
        this.toggleSearchClearBtn();
        this.filterRequests();
    }
    
    filterRequests() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const methodFilter = this.methodFilter.value;
        const statusFilter = this.statusFilter.value;
        const typeFilter = this.typeFilter.value;
        
        this.filteredRequests = this.requests.filter(request => {
            // 搜索匹配 - 不区分大小写，只匹配URL
            const matchesSearch = !searchTerm || 
                request.url.toLowerCase().includes(searchTerm);
            
            // 方法过滤
            const matchesMethod = !methodFilter || request.method === methodFilter;
            
            // 状态过滤
            let matchesStatus = true;
            if (statusFilter) {
                if (statusFilter === '1xx') {
                    matchesStatus = request.response && request.response.status >= 100 && request.response.status < 200;
                } else if (statusFilter === '2xx') {
                    matchesStatus = request.response && request.response.status >= 200 && request.response.status < 300;
                } else if (statusFilter === '3xx') {
                    matchesStatus = request.response && request.response.status >= 300 && request.response.status < 400;
                } else if (statusFilter === '4xx') {
                    matchesStatus = request.response && request.response.status >= 400 && request.response.status < 500;
                } else if (statusFilter === '5xx') {
                    matchesStatus = request.response && request.response.status >= 500;
                } else if (statusFilter === 'pending') {
                    matchesStatus = !request.response;
                }
            }
            
            // 类型过滤
            let matchesType = true;
            if (typeFilter) {
                if (typeFilter === 'captured') {
                    matchesType = !request.isReplayed && !request.isCustom && !request.isImported;
                } else if (typeFilter === 'replayed') {
                    matchesType = request.isReplayed;
                } else if (typeFilter === 'custom') {
                    matchesType = request.isCustom;
                } else if (typeFilter === 'imported') {
                    matchesType = request.isImported;
                }
            }
            
            return matchesSearch && matchesMethod && matchesStatus && matchesType;
        });
        
        this.renderRequestsList();
        this.updateRequestCount();
    }
    
    updateUI() {
        // 应用当前的过滤条件而不是显示所有请求
        this.filterRequests();
    }
    
    renderRequestsList() {
        if (this.filteredRequests.length === 0) {
            this.requestsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📡</div>
                    <p>暂无捕获的请求</p>
                    <p class="empty-hint">浏览网页时，API请求会自动显示在这里</p>
                </div>
            `;
            return;
        }
        
        const html = this.filteredRequests.map(request => 
            this.renderRequestItem(request)
        ).join('');
        
        this.requestsList.innerHTML = html;
        
        // 绑定点击事件
        this.requestsList.querySelectorAll('.request-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectRequest(this.filteredRequests[index]);
            });
        });
    }
    
    renderRequestItem(request) {
        const statusClass = request.response && request.response.status < 400 ? 'status-success' : 'status-error';
        const time = new Date(request.timestamp).toLocaleTimeString();
        const replayedBadge = request.isReplayed ? '<i class="fas fa-redo replayed-badge" title="重放请求"></i>' : '';
        
        // 解析URL
        const urlParts = this.parseUrl(request.url);
        
        return `
            <div class="request-item ${request.isReplayed ? 'replayed-request' : ''}" data-id="${request.id}">
                <div class="request-header">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="request-method method-tag method-${request.method.toLowerCase()}">${request.method}</span>
                        ${replayedBadge}
                    </div>
                    <span class="request-status ${statusClass}">
                        ${request.response ? request.response.status : '•••'}
                    </span>
                </div>
                <div class="request-url" title="${request.url}">
                    <span class="request-path">${urlParts.name}</span>
                    <span class="request-domain">${urlParts.domain}</span>
                </div>
                <div class="request-time">
                    <span>${time}</span>
                    ${request.duration ? `<span class="request-duration">${request.duration}ms</span>` : ''}
                </div>
            </div>
        `;
    }
    
    parseUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const pathParts = pathname.split('/').filter(p => p);
            
            // 提取最后一个路径段作为名称
            let name = pathParts.length > 0 ? pathParts[pathParts.length - 1] : urlObj.hostname;
            
            // 如果名称包含查询参数，去掉它们
            if (name && name.includes('?')) {
                name = name.split('?')[0];
            }
            
            // 如果名称为空，使用hostname
            if (!name) {
                name = urlObj.hostname;
            }
            
            const domain = urlObj.hostname + (urlObj.port ? ':' + urlObj.port : '');
            
            // 解析查询参数
            const queryParams = {};
            urlObj.searchParams.forEach((value, key) => {
                queryParams[key] = value;
            });
            
            return {
                name: name,
                path: pathname + urlObj.search,
                domain: domain,
                protocol: urlObj.protocol,
                queryParams: queryParams,
                hasQueryParams: Object.keys(queryParams).length > 0
            };
        } catch (error) {
            console.error('URL解析失败:', url, error);
            // 如果URL解析失败，尝试提取最后一个路径段
            const parts = url.split('/').filter(p => p);
            const lastPart = parts[parts.length - 1] || url;
            const name = lastPart.split('?')[0] || url;
            
            return {
                name: name,
                path: url,
                domain: '',
                protocol: '',
                queryParams: {},
                hasQueryParams: false
            };
        }
    }
    
    truncateUrl(url, maxLength = 60) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    }
    
    selectRequest(request) {
        // 使用SelectionManager更新视觉反馈
        this.selectionManager.selectRequest(request.id, request.method);
        
        this.selectedRequest = request;
        this.renderRequestDetails(request);
        
        // 启用操作按钮
        this.replayBtn.disabled = false;
        this.editBtn.disabled = false;
        this.duplicateBtn.disabled = false;
    }
    
    renderRequestDetails(request) {
        const html = `
            <div class="detail-section collapsible-section" data-section-id="basicInfo-${request.id}">
                <div class="section-header">
                    <button class="collapse-toggle" data-section="basicInfo-${request.id}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <h4>基本信息</h4>
                    <div class="section-actions">
                        <button class="btn-icon-small copy-section-btn" onclick="window.apiPanel.copyBasicInfo('${request.id}')" title="复制基本信息">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="section-content" style="display: block;">
                <div class="detail-info">
                    <div class="detail-label">名称:</div>
                    <div class="detail-value">${CopyManager.extractName(request.url)}</div>
                    <div class="detail-label">类型:</div>
                    <div class="detail-value">${CopyManager.getRequestType(request)}</div>
                    <div class="detail-label">方法:</div>
                    <div class="detail-value">${request.method}</div>
                    <div class="detail-label">URL:</div>
                    <div class="detail-value">${request.url}</div>
                    ${this.hasEncodedParams(request.url) ? `
                        <div class="detail-label">URL (解码):</div>
                        <div class="detail-value">${this.decodeUrl(request.url)}</div>
                    ` : ''}
                    <div class="detail-label">远程地址:</div>
                    <div class="detail-value">${this.getRemoteAddress(request)}</div>
                    <div class="detail-label">状态:</div>
                    <div class="detail-value">${request.response ? `${request.response.status} ${request.response.statusText}` : 'Pending'}</div>
                    <div class="detail-label">时间:</div>
                    <div class="detail-value">${new Date(request.timestamp).toLocaleString()}</div>
                    ${request.duration ? `
                        <div class="detail-label">耗时:</div>
                        <div class="detail-value">${request.duration}ms</div>
                    ` : ''}
                    <div class="detail-label">引用站点策略:</div>
                    <div class="detail-value">${this.getReferrerPolicy(request)}</div>
                </div>
                </div>
            </div>
            
            ${this.hasQueryParams(request.url) ? `
                <div class="detail-section collapsible-section" data-section-id="queryParams-${request.id}">
                    <div class="section-header">
                        <button class="collapse-toggle" data-section="queryParams-${request.id}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <h4>查询参数</h4>
                        <div class="section-actions">
                            <button class="btn-icon-small copy-section-btn" onclick="window.apiPanel.copyQueryParams('${request.id}')" title="复制查询参数">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div class="section-content" style="display: block;">
                        <div class="headers-view-container" id="queryParamsView-${request.id}"></div>
                    </div>
                </div>
            ` : ''}
            
            <div class="detail-section collapsible-section" data-section-id="requestHeaders-${request.id}">
                <div class="section-header">
                    <button class="collapse-toggle" data-section="requestHeaders-${request.id}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <h4>请求头</h4>
                    <div class="section-actions">
                        <button class="btn-icon-small copy-section-btn" onclick="window.apiPanel.copyRequestHeaders('${request.id}')" title="复制请求头">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div class="section-content" style="display: block;">
                    <div class="headers-view-container" id="requestHeadersView-${request.id}"></div>
                </div>
            </div>
            
            ${request.body ? `
                <div class="detail-section collapsible-section" data-section-id="requestBody-${request.id}">
                    <div class="section-header">
                        <button class="collapse-toggle" data-section="requestBody-${request.id}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <h4>请求体</h4>
                        <div class="section-actions">
                            <button class="btn-icon-small copy-section-btn" onclick="window.apiPanel.copyRequestBody('${request.id}')" title="复制请求体">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div class="section-content" style="display: block;">
                        <div class="body-view-container" id="requestBodyView-${request.id}"></div>
                    </div>
                </div>
            ` : ''}
            
            ${request.response ? `
                <div class="detail-section collapsible-section" data-section-id="responseHeaders-${request.id}">
                    <div class="section-header">
                        <button class="collapse-toggle" data-section="responseHeaders-${request.id}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <h4>响应头</h4>
                        <div class="section-actions">
                            <button class="btn-icon-small copy-section-btn" onclick="window.apiPanel.copyResponseHeaders('${request.id}')" title="复制响应头">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div class="section-content" style="display: block;">
                        <div class="headers-view-container" id="responseHeadersView-${request.id}"></div>
                    </div>
                </div>
                
                <div class="detail-section collapsible-section" data-section-id="responseBody-${request.id}">
                    <div class="section-header">
                        <button class="collapse-toggle" data-section="responseBody-${request.id}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <h4>响应体</h4>
                        <div class="section-actions">
                            <button class="btn-icon-small copy-section-btn" onclick="window.apiPanel.copyResponseBody('${request.id}')" title="复制响应体">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div class="section-content" style="display: block;">
                        <div class="body-view-container" id="responseBodyView-${request.id}"></div>
                    </div>
                </div>
            ` : ''}
        `;
        
        this.detailsContent.innerHTML = html;
        
        // 暴露到全局，供onclick使用
        window.apiPanel = this;
        
        // 重新绑定动态生成的按钮事件
        this.bindDynamicEvents(request);
    }
    
    // 检查URL是否有查询参数
    hasQueryParams(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.search.length > 0;
        } catch {
            return false;
        }
    }
    
    // 检查URL是否包含编码的参数（如中文）
    hasEncodedParams(url) {
        try {
            // 检查URL中是否包含%编码
            return url.includes('%') && url !== decodeURIComponent(url);
        } catch {
            return false;
        }
    }
    
    // 解码URL
    decodeUrl(url) {
        try {
            return decodeURIComponent(url);
        } catch {
            return url;
        }
    }
    
    // 获取查询参数对象
    getQueryParams(url) {
        try {
            const urlObj = new URL(url);
            const params = {};
            urlObj.searchParams.forEach((value, key) => {
                params[key] = value;
            });
            return params;
        } catch {
            return {};
        }
    }
    
    // 获取远程地址
    getRemoteAddress(request) {
        try {
            // 从URL解析
            const urlObj = new URL(request.url);
            const port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
            let remoteAddress = `${urlObj.hostname}:${port}`;
            
            // 优先从响应头中获取（如果有的话）
            if (request.response && request.response.headers) {
                const headers = request.response.headers;
                // 尝试从各种可能的头部获取服务器信息
                if (headers['x-forwarded-for']) {
                    remoteAddress = headers['x-forwarded-for'];
                } else if (headers['x-real-ip']) {
                    remoteAddress = headers['x-real-ip'];
                }
            }
            
            return remoteAddress;
        } catch (error) {
            console.error('解析远程地址失败:', error, request.url);
            return 'N/A';
        }
    }
    
    // 获取引用站点策略
    getReferrerPolicy(request) {
        // 优先从请求头中获取
        if (request.headers && request.headers['referrer-policy']) {
            return request.headers['referrer-policy'];
        }
        
        // 从响应头中获取
        if (request.response && request.response.headers && request.response.headers['referrer-policy']) {
            return request.response.headers['referrer-policy'];
        }
        
        // 如果有referrerPolicy属性
        if (request.referrerPolicy) {
            return request.referrerPolicy;
        }
        
        // 默认策略
        return 'strict-origin-when-cross-origin';
    }
    
    // 绑定动态生成的事件
    bindDynamicEvents(request) {
        // 绑定基本信息复制按钮
        const copyBasicInfoBtn = this.detailsContent.querySelector(`[onclick*="copyBasicInfo('${request.id}')"]`);
        if (copyBasicInfoBtn) {
            copyBasicInfoBtn.onclick = (e) => {
                e.preventDefault();
                this.copyBasicInfo(request.id);
            };
        }
        
        // 绑定请求头复制按钮
        const copyHeadersBtn = this.detailsContent.querySelector(`[onclick*="copyRequestHeaders('${request.id}')"]`);
        if (copyHeadersBtn) {
            copyHeadersBtn.onclick = (e) => {
                e.preventDefault();
                this.copyRequestHeaders(request.id);
            };
        }
        
        // 绑定请求体复制按钮
        const copyBodyBtn = this.detailsContent.querySelector(`[onclick*="copyRequestBody('${request.id}')"]`);
        if (copyBodyBtn) {
            copyBodyBtn.onclick = (e) => {
                e.preventDefault();
                this.copyRequestBody(request.id);
            };
        }
        
        // 绑定响应头复制按钮
        const copyResponseHeadersBtn = this.detailsContent.querySelector(`[onclick*="copyResponseHeaders('${request.id}')"]`);
        if (copyResponseHeadersBtn) {
            copyResponseHeadersBtn.onclick = (e) => {
                e.preventDefault();
                this.copyResponseHeaders(request.id);
            };
        }
        
        // 绑定响应体复制按钮
        const copyResponseBtn = this.detailsContent.querySelector(`[onclick*="copyResponseBody('${request.id}')"]`);
        if (copyResponseBtn) {
            copyResponseBtn.onclick = (e) => {
                e.preventDefault();
                this.copyResponseBody(request.id);
            };
        }
        
        // 绑定查询参数复制按钮
        const copyQueryParamsBtn = this.detailsContent.querySelector(`[onclick*="copyQueryParams('${request.id}')"]`);
        if (copyQueryParamsBtn) {
            copyQueryParamsBtn.onclick = (e) => {
                e.preventDefault();
                this.copyQueryParams(request.id);
            };
        }
        
        // 渲染查询参数视图
        if (this.hasQueryParams(request.url)) {
            const queryParamsContainer = document.getElementById(`queryParamsView-${request.id}`);
            if (queryParamsContainer) {
                const queryParams = this.getQueryParams(request.url);
                const queryParamsSwitcher = new HeadersViewSwitcher(
                    queryParams, 
                    queryParamsContainer, 
                    `queryParams-${request.id}`
                );
                queryParamsSwitcher.render();
            }
        }
        
        // 渲染请求体视图切换器
        if (request.body) {
            const requestBodyContainer = document.getElementById(`requestBodyView-${request.id}`);
            if (requestBodyContainer) {
                const requestBodySwitcher = new BodyViewSwitcher(
                    request.body, 
                    requestBodyContainer, 
                    `requestBody-${request.id}`
                );
                requestBodySwitcher.render();
            }
        }
        
        // 渲染响应体视图切换器
        if (request.response && request.response.body) {
            const responseBodyContainer = document.getElementById(`responseBodyView-${request.id}`);
            if (responseBodyContainer) {
                const responseBodySwitcher = new BodyViewSwitcher(
                    request.response.body, 
                    responseBodyContainer, 
                    `responseBody-${request.id}`
                );
                responseBodySwitcher.render();
            }
        }
        
        // 渲染请求头视图切换器
        const requestHeadersContainer = document.getElementById(`requestHeadersView-${request.id}`);
        if (requestHeadersContainer) {
            const requestHeadersSwitcher = new HeadersViewSwitcher(
                request.headers, 
                requestHeadersContainer, 
                `requestHeaders-${request.id}`
            );
            requestHeadersSwitcher.render();
        }
        
        // 渲染响应头视图切换器
        if (request.response) {
            const responseHeadersContainer = document.getElementById(`responseHeadersView-${request.id}`);
            if (responseHeadersContainer) {
                const responseHeadersSwitcher = new HeadersViewSwitcher(
                    request.response.headers, 
                    responseHeadersContainer, 
                    `responseHeaders-${request.id}`
                );
                responseHeadersSwitcher.render();
            }
        }
        
        // 绑定折叠按钮事件
        CollapsibleSection.bindEvents(this.detailsContent);
    }
    
    // 复制基本信息
    async copyBasicInfo(requestId) {
        try {
            const request = this.requests.find(r => r.id === requestId) || this.selectedRequest;
            if (!request) {
                this.showNotification('未找到请求', 'error');
                return;
            }
            const text = CopyManager.formatBasicInfo(request);
            this.fallbackCopy(text);
        } catch (error) {
            console.error('复制失败:', error);
            this.showNotification('复制失败: ' + error.message, 'error');
        }
    }
    
    // 复制查询参数
    async copyQueryParams(requestId) {
        try {
            const request = this.requests.find(r => r.id === requestId) || this.selectedRequest;
            if (!request) {
                this.showNotification('未找到请求', 'error');
                return;
            }
            const queryParams = this.getQueryParams(request.url);
            if (Object.keys(queryParams).length === 0) {
                this.showNotification('查询参数为空', 'warning');
                return;
            }
            const paramsText = JSON.stringify(queryParams, null, 2);
            this.fallbackCopy(paramsText);
        } catch (error) {
            console.error('复制失败:', error);
            this.showNotification('复制失败: ' + error.message, 'error');
        }
    }
    
    // 复制请求头
    async copyRequestHeaders(requestId) {
        try {
            const request = this.requests.find(r => r.id === requestId) || this.selectedRequest;
            if (!request) {
                this.showNotification('未找到请求', 'error');
                return;
            }
            const headers = typeof request.headers === 'object' 
                ? JSON.stringify(request.headers, null, 2)
                : request.headers || '无请求头';
            this.fallbackCopy(headers);
        } catch (error) {
            console.error('复制失败:', error);
            this.showNotification('复制失败: ' + error.message, 'error');
        }
    }
    
    // 复制请求体
    async copyRequestBody(requestId) {
        try {
            const request = this.requests.find(r => r.id === requestId) || this.selectedRequest;
            if (!request) {
                this.showNotification('未找到请求', 'error');
                return;
            }
            if (!request.body) {
                this.showNotification('请求体为空', 'warning');
                return;
            }
            
            // 检查当前视图模式
            const container = document.getElementById(`requestBodyView-${requestId}`);
            const isRawMode = container && container.querySelector('.view-btn[data-mode="raw"].active');
            
            let body;
            if (isRawMode) {
                // 原始模式：紧凑格式，无空格无换行
                body = typeof request.body === 'object' 
                    ? JSON.stringify(request.body) 
                    : request.body;
            } else {
                // 格式化模式：带缩进和换行
                body = typeof request.body === 'object' 
                    ? JSON.stringify(request.body, null, 2) 
                    : request.body;
            }
            
            this.fallbackCopy(body);
        } catch (error) {
            console.error('复制失败:', error);
            this.showNotification('复制失败: ' + error.message, 'error');
        }
    }
    
    // 复制响应头
    async copyResponseHeaders(requestId) {
        try {
            const request = this.requests.find(r => r.id === requestId) || this.selectedRequest;
            if (!request) {
                this.showNotification('未找到请求', 'error');
                return;
            }
            if (!request.response || !request.response.headers) {
                this.showNotification('响应头为空', 'warning');
                return;
            }
            const headers = typeof request.response.headers === 'object'
                ? JSON.stringify(request.response.headers, null, 2)
                : request.response.headers;
            this.fallbackCopy(headers);
        } catch (error) {
            console.error('复制失败:', error);
            this.showNotification('复制失败: ' + error.message, 'error');
        }
    }
    
    // 复制响应体
    async copyResponseBody(requestId) {
        try {
            const request = this.requests.find(r => r.id === requestId) || this.selectedRequest;
            if (!request) {
                this.showNotification('未找到请求', 'error');
                return;
            }
            if (!request.response || !request.response.body) {
                this.showNotification('响应体为空', 'warning');
                return;
            }
            
            // 检查当前视图模式
            const container = document.getElementById(`responseBodyView-${requestId}`);
            const isRawMode = container && container.querySelector('.view-btn[data-mode="raw"].active');
            
            let body;
            if (isRawMode) {
                // 原始模式：紧凑格式，无空格无换行
                body = typeof request.response.body === 'object' 
                    ? JSON.stringify(request.response.body) 
                    : request.response.body;
            } else {
                // 格式化模式：带缩进和换行
                body = typeof request.response.body === 'object' 
                    ? JSON.stringify(request.response.body, null, 2) 
                    : request.response.body;
            }
            
            this.fallbackCopy(body);
        } catch (error) {
            console.error('复制失败:', error);
            this.showNotification('复制失败: ' + error.message, 'error');
        }
    }
    
    // 备用复制方法（使用execCommand）
    fallbackCopy(text) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (successful) {
                this.showNotification('已复制到剪贴板', 'success');
            } else {
                this.showNotification('复制失败，请手动复制', 'error');
            }
        } catch (err) {
            console.error('备用复制方法也失败:', err);
            this.showNotification('复制失败，请手动复制', 'error');
        }
    }
    
    renderHeaders(headers) {
        if (!headers) return '<div class="empty-state">无请求头</div>';
        
        let headerEntries = [];
        
        if (Array.isArray(headers)) {
            // 如果是数组格式
            headerEntries = headers.map(h => [h.name || h.key, h.value]);
        } else if (typeof headers === 'object' && headers !== null) {
            // 如果是对象格式，检查是否为空对象
            if (Object.keys(headers).length === 0) {
                return '<div class="empty-state">无请求头</div>';
            }
            headerEntries = Object.entries(headers);
        } else if (typeof headers === 'string') {
            // 如果是字符串，检查是否为"[object Object]"
            if (headers === '[object Object]') {
                return '<div class="empty-state">请求头数据格式错误</div>';
            }
            // 尝试解析为JSON
            try {
                const parsed = JSON.parse(headers);
                if (typeof parsed === 'object' && parsed !== null) {
                    headerEntries = Object.entries(parsed);
                } else {
                    return '<div class="empty-state">请求头格式错误</div>';
                }
            } catch (error) {
                // 如果不是JSON，可能是单个请求头字符串
                return `<div class="empty-state">请求头格式错误: ${error.message}</div>`;
            }
        } else {
            return '<div class="empty-state">无效的请求头格式</div>';
        }
        
        if (headerEntries.length === 0) {
            return '<div class="empty-state">无请求头</div>';
        }
        
        return headerEntries.map(([name, value]) => {
            // 确保name和value都是字符串
            const safeName = String(name || '');
            const safeValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
            
            return `
                <div class="header-item">
                    <div class="header-name">${this.escapeHtml(safeName)}:</div>
                    <div class="header-value">${this.escapeHtml(safeValue)}</div>
                </div>
            `;
        }).join('');
    }
    
    formatJson(text) {
        if (!text) return '';
        
        // 如果是对象，直接格式化
        if (typeof text === 'object') {
            try {
                return JSON.stringify(text, null, 2);
            } catch (error) {
                return String(text);
            }
        }
        
        // 如果是字符串，尝试解析
        try {
            const parsed = JSON.parse(text);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return String(text);
        }
    }
    
    // HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateRequestCount() {
        this.requestCount.textContent = this.filteredRequests.length;
    }
    
    clearRequests() {
        chrome.runtime.sendMessage({ type: 'CLEAR_REQUESTS' });
        this.requests = [];
        this.selectedRequest = null;
        this.updateUI();
        this.detailsContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👆</div>
                <p>选择一个请求查看详情</p>
            </div>
        `;
        this.replayBtn.disabled = true;
        this.editBtn.disabled = true;
        this.duplicateBtn.disabled = true;
        this.showNotification('所有请求已清空', 'success');
    }
    
    // 清空请求列表（不重新加载页面）
    clearRequestsList() {
        this.requests = [];
        this.selectedRequest = null;
        this.updateUI();
        this.detailsContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👆</div>
                <p>选择一个请求查看详情</p>
            </div>
        `;
        this.replayBtn.disabled = true;
        this.editBtn.disabled = true;
        this.duplicateBtn.disabled = true;
        this.showNotification('请求列表已清空', 'success');
    }
    
    async exportRequests() {
        try {
            // 显示文件名输入对话框
            const fileName = prompt('请输入导出文件名（不含扩展名）:', `restflow-export-${new Date().toISOString().split('T')[0]}`);
            
            if (!fileName) {
                this.showNotification('导出已取消', 'info');
                return;
            }
            
            const response = await chrome.runtime.sendMessage({
                type: 'EXPORT_REQUESTS'
            });
            
            if (response.success) {
                // 创建更详细的导出数据
                const exportData = JSON.parse(response.data);
                exportData.exportInfo = {
                    exportedAt: new Date().toISOString(),
                    totalRequests: exportData.requests.length,
                    pluginVersion: '1.0.0',
                    format: 'restflow-v1',
                    fileName: fileName
                };
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                    type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.showNotification(`成功导出 ${exportData.requests.length} 个请求到 ${fileName}.json`, 'success');
            }
        } catch (error) {
            this.showNotification('导出失败: ' + error.message, 'error');
        }
    }
    
    importRequests(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.name.endsWith('.json')) {
            this.showNotification('请选择JSON格式的文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // 验证导入数据格式
                if (!this.validateImportData(importData)) {
                    this.showNotification('导入文件格式不正确', 'error');
                    return;
                }
                
                chrome.runtime.sendMessage({
                    type: 'IMPORT_REQUESTS',
                    data: e.target.result
                });
                
                const requestCount = importData.requests ? importData.requests.length : 0;
                this.showNotification(`成功导入 ${requestCount} 个请求`, 'success');
                
            } catch (error) {
                this.showNotification('导入失败: ' + error.message, 'error');
            }
        };
        
        reader.onerror = () => {
            this.showNotification('文件读取失败', 'error');
        };
        
        reader.readAsText(file);
        
        // 清空文件选择，允许重复选择同一文件
        event.target.value = '';
    }
    
    validateImportData(data) {
        // 检查基本结构
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // 检查是否有requests数组
        if (!Array.isArray(data.requests)) {
            return false;
        }
        
        // 检查每个请求的基本字段
        return data.requests.every(request => 
            request && 
            typeof request === 'object' &&
            request.url && 
            request.method
        );
    }
    
    replayRequest() {
        if (!this.selectedRequest) return;
        
        chrome.runtime.sendMessage({
            type: 'REPLAY_REQUEST',
            data: this.selectedRequest
        });
    }
    
    editRequest() {
        if (!this.selectedRequest) {
            this.showNotification('请先选择一个请求', 'warning');
            return;
        }
        
        this.modalTitle.textContent = '编辑请求';
        
        // 重置认证tab初始化标志
        this._authTabInitialized = false;
        
        // 填充基本信息
        this.editMethod.value = this.selectedRequest.method;
        this.editUrl.value = this.selectedRequest.url;
        
        // 清空所有动态行
        this.clearAllRows();
        
        // 预填充请求头
        if (this.selectedRequest.headers) {
            this.prefillHeaders(this.selectedRequest.headers);
        }
        
        // 预填充请求体
        if (this.selectedRequest.body) {
            this.prefillBody(this.selectedRequest.body);
        }
        
        // 从URL中提取并预填充参数
        try {
            const urlObj = new URL(this.selectedRequest.url);
            const params = {};
            urlObj.searchParams.forEach((value, key) => {
                params[key] = value;
            });
            if (Object.keys(params).length > 0) {
                this.prefillParams(params);
            } else {
                // 如果没有参数，添加一个空行
                this.addParamRow();
            }
        } catch (error) {
            // URL解析失败，添加一个空行
            this.addParamRow();
        }
        
        // 如果没有请求头，添加一个空行
        if (!this.selectedRequest.headers || Object.keys(this.selectedRequest.headers).length === 0) {
            this.addHeaderRow();
        }
        
        // 切换到参数tab
        this.switchTab('params');
        
        // 先显示模态框
        this.editModal.style.display = 'block';
        
        // 保存请求信息，用于后续认证检测
        this._pendingAuthHeaders = this.selectedRequest.headers;
        
        // 立即尝试检测认证（如果authContent已存在）
        if (this.selectedRequest.headers) {
            setTimeout(() => {
                const authContent = document.getElementById('authContent');
                if (authContent) {
                    console.log('authContent已存在，立即检测认证');
                    this.detectAndSetAuth(this.selectedRequest.headers);
                } else {
                    console.log('authContent不存在，等待tab切换');
                }
            }, 150);
        }
    }
    
    addJsonValidation() {
        const validateJson = (textarea, errorId) => {
            const errorElement = document.getElementById(errorId) || this.createErrorElement(errorId, textarea);
            
            const validate = () => {
                try {
                    if (textarea.value.trim()) {
                        JSON.parse(textarea.value);
                    }
                    errorElement.style.display = 'none';
                    textarea.style.borderColor = '#ddd';
                } catch (error) {
                    errorElement.textContent = `JSON格式错误: ${error.message}`;
                    errorElement.style.display = 'block';
                    textarea.style.borderColor = '#dc3545';
                }
            };
            
            textarea.addEventListener('input', validate);
            validate(); // 初始验证
        };
        
        validateJson(this.editHeaders, 'headers-error');
        validateJson(this.editBody, 'body-error');
    }
    
    createErrorElement(id, textarea) {
        const errorElement = document.createElement('div');
        errorElement.id = id;
        errorElement.style.cssText = `
            color: #dc3545;
            font-size: 11px;
            margin-top: 4px;
            display: none;
        `;
        textarea.parentNode.appendChild(errorElement);
        return errorElement;
    }
    
    closeEditModal() {
        this.editModal.style.display = 'none';
    }
    
    sendEditedRequest() {
        try {
            const requestData = {
                id: this.selectedRequest?.id || this.generateId(),
                method: this.editMethod.value,
                url: this.editUrl.value,
                headers: JSON.parse(this.editHeaders?.value || '{}'),
                body: this.editBody?.value || ''
            };
            
            // 验证URL
            if (!requestData.url.trim()) {
                this.showNotification('请输入有效的URL', 'error');
                return;
            }
            
            chrome.runtime.sendMessage({
                type: 'REPLAY_REQUEST',
                data: requestData
            });
            
            this.closeEditModal();
            this.showNotification('请求已发送', 'success');
        } catch (error) {
            this.showNotification('请求发送失败: ' + error.message, 'error');
        }
    }
    
    handleReplaySuccess(data) {
        // 显示成功消息
        this.showNotification(`请求重放成功！状态: ${data.newRequest.response.status}`, 'success');
        
        // 自动选择新的重放请求
        setTimeout(() => {
            this.selectRequest(data.newRequest);
        }, 100);
    }
    
    handleReplayError(data) {
        this.showNotification(`请求重放失败: ${data.error}`, 'error');
    }
    
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 复制请求头
    copyHeaders() {
        try {
            const headers = this.collectHeaders();
            const headersText = JSON.stringify(headers, null, 2);
            navigator.clipboard.writeText(headersText);
            this.showNotification('请求头已复制到剪贴板', 'success');
        } catch (error) {
            this.showNotification('复制失败: ' + error.message, 'error');
        }
    }
    
    // 复制请求体
    copyBody() {
        try {
            const body = this.collectBody();
            if (body) {
                navigator.clipboard.writeText(body);
                this.showNotification('请求体已复制到剪贴板', 'success');
            } else {
                this.showNotification('请求体为空', 'warning');
            }
        } catch (error) {
            this.showNotification('复制失败: ' + error.message, 'error');
        }
    }
    

    
    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // 收集请求头（用于复制功能）
    collectHeaders() {
        const headers = {};
        
        // 从表单模式收集
        const headerRows = document.querySelectorAll('.header-row');
        headerRows.forEach(row => {
            const key = row.querySelector('.header-key')?.value?.trim();
            const value = row.querySelector('.header-value')?.value?.trim();
            if (key && value) {
                headers[key] = value;
            }
        });
        
        // 如果没有表单数据，尝试从Raw模式获取
        if (Object.keys(headers).length === 0) {
            const rawHeaders = document.getElementById('editHeadersRaw')?.value;
            if (rawHeaders) {
                try {
                    return JSON.parse(rawHeaders);
                } catch (error) {
                    return {};
                }
            }
        }
        
        return headers;
    }
    
    // 收集请求体（用于复制功能）
    collectBody() {
        const bodyType = document.getElementById('bodyType')?.value || 'json';
        
        switch (bodyType) {
            case 'json':
                return document.getElementById('editBodyJson')?.value?.trim() || '';
            case 'form':
                return this.collectFormData();
            case 'raw':
                return document.getElementById('editBodyRaw')?.value?.trim() || '';
            default:
                return '';
        }
    }
    
    // 收集表单数据
    collectFormData() {
        const formData = {};
        const formRows = document.querySelectorAll('.form-field-row');
        
        formRows.forEach(row => {
            const key = row.querySelector('.form-key')?.value?.trim();
            const value = row.querySelector('.form-value')?.value?.trim();
            if (key && value) {
                formData[key] = value;
            }
        });
        
        return JSON.stringify(formData);
    }
    
    // 新建请求功能
    newRequest() {
        this.selectedRequest = null;
        this.modalTitle.textContent = '新建请求';
        
        // 重置认证tab初始化标志
        this._authTabInitialized = false;
        this._pendingAuthHeaders = null;
        
        // 重置所有表单字段
        this.editMethod.value = 'GET';
        this.editUrl.value = '';
        
        // 清空所有输入
        this.clearModalInputs();
        
        // 重置到第一个tab
        this.switchTab('params');
        
        // 清空所有动态生成的行
        this.clearAllRows();
        
        // 添加默认的空行
        this.addParamRow();
        this.addHeaderRow();
        
        this.editModal.style.display = 'block';
    }
    
    // 显示复制菜单
    showCopyMenu(event) {
        if (!this.selectedRequest) {
            this.showNotification('请先选择一个请求', 'warning');
            return;
        }
        
        event.stopPropagation();
        
        // 移除已存在的菜单
        const existingMenu = document.querySelector('.copy-type-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // 创建菜单
        const menu = document.createElement('div');
        menu.className = 'copy-type-menu';
        menu.innerHTML = `
            <div class="copy-menu-item" data-type="curl-cmd">
                <i class="fas fa-terminal"></i> cURL (CMD)
            </div>
            <div class="copy-menu-item" data-type="curl-bash">
                <i class="fas fa-terminal"></i> cURL (Bash)
            </div>
            <div class="copy-menu-item" data-type="powershell">
                <i class="fas fa-code"></i> PowerShell
            </div>
            <div class="copy-menu-item" data-type="fetch">
                <i class="fab fa-js"></i> Fetch
            </div>
            <div class="copy-menu-item" data-type="fetch-node">
                <i class="fab fa-node-js"></i> Fetch (Node.js)
            </div>
        `;
        
        // 定位菜单
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '10000';
        
        document.body.appendChild(menu);
        
        // 绑定菜单项点击事件
        menu.querySelectorAll('.copy-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.copyRequestAs(type);
                menu.remove();
            });
        });
        
        // 点击外部关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }
    
    // 复制请求为指定格式
    copyRequestAs(type) {
        if (!this.selectedRequest) return;
        
        let code = '';
        const request = this.selectedRequest;
        
        switch (type) {
            case 'curl-cmd':
                code = this.generateCurlCmd(request);
                break;
            case 'curl-bash':
                code = this.generateCurlBash(request);
                break;
            case 'powershell':
                code = this.generatePowerShell(request);
                break;
            case 'fetch':
                code = this.generateFetch(request);
                break;
            case 'fetch-node':
                code = this.generateFetchNode(request);
                break;
        }
        
        this.fallbackCopy(code);
    }
    
    // 生成cURL (CMD)
    generateCurlCmd(request) {
        let curl = `curl "${request.url}"`;
        
        // 处理headers
        const headers = this.normalizeHeaders(request.headers);
        if (headers && Object.keys(headers).length > 0) {
            Object.entries(headers).forEach(([key, value]) => {
                const valueStr = String(value);
                curl += ` ^\n-H "${key}: ${valueStr}"`;
            });
        }
        
        // 处理body
        if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
            const body = typeof request.body === 'object' 
                ? JSON.stringify(request.body) 
                : String(request.body);
            curl += ` ^\n--data-raw "${body.replace(/"/g, '\\"')}"`;
        }
        
        curl += ' --insecure';
        
        return curl;
    }
    
    // 生成cURL (Bash)
    generateCurlBash(request) {
        let curl = `curl '${request.url}'`;
        
        if (headers && Object.keys(headers).length > 0) {
            Object.entries(headers).forEach(([key, value]) => {
                const valueStr = String(value);
                curl += ` \\\n  -H '${key}: ${valueStr}'`;
            });
        }
        
        // 处理body
        if (request.body && request.method !== 'GET' && request.method !== 'HEAD') {
            const body = typeof request.body === 'object' 
                ? JSON.stringify(request.body) 
                : String(request.body);
            curl += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
        }
        
        return curl;
    }
    
    // 标准化headers格式
    normalizeHeaders(headers) {
        if (!headers) return {};
        
        // 如果是数组格式 [{name: "Accept", value: "application/json"}]
        if (Array.isArray(headers)) {
            const normalized = {};
            headers.forEach(header => {
                const key = header.name || header.key;
                const value = header.value;
                if (key && value !== undefined) {
                    normalized[key] = value;
                }
            });
            return normalized;
        }
        
        // 如果已经是对象格式
        if (typeof headers === 'object') {
            return headers;
        }
        
        // 如果是字符串，尝试解析
        if (typeof headers === 'string') {
            try {
                return JSON.parse(headers);
            } catch {
                return {};
            }
        }
        
        return {};
    }
    
    // 生成PowerShell
    generatePowerShell(request) {
        const headers = this.normalizeHeaders(request.headers);
        const hasBody = request.body && request.method !== 'GET' && request.method !== 'HEAD';
        
        let ps = `$headers = @{\n`;
        if (headers && Object.keys(headers).length > 0) {
            Object.entries(headers).forEach(([key, value]) => {
                const valueStr = String(value);
                ps += `    "${key}" = "${valueStr}"\n`;
            });
        }
        ps += `}\n\n`;
        
        if (hasBody) {
            const body = typeof request.body === 'object' 
                ? JSON.stringify(request.body, null, 2) 
                : String(request.body);
            ps += `$body = @"\n${body}\n"@\n\n`;
            ps += `Invoke-RestMethod -Uri "${request.url}" -Method ${request.method} -Headers $headers -Body $body`;
        } else {
            ps += `Invoke-RestMethod -Uri "${request.url}" -Method ${request.method} -Headers $headers`;
        }
        
        return ps;
    }
    
    // 生成Fetch
    generateFetch(request) {
        const headers = this.normalizeHeaders(request.headers);
        const hasBody = request.body && request.method !== 'GET' && request.method !== 'HEAD';
        
        let headersStr = '';
        if (headers && Object.keys(headers).length > 0) {
            headersStr = Object.entries(headers)
                .map(([key, value]) => {
                    const valueStr = String(value);
                    return `    '${key}': '${valueStr}'`;
                })
                .join(',\n');
        }
        
        let bodyStr = '';
        if (hasBody) {
            if (typeof request.body === 'object') {
                bodyStr = `  body: JSON.stringify(${JSON.stringify(request.body, null, 2)}),\n`;
            } else {
                bodyStr = `  body: '${String(request.body)}',\n`;
            }
        }
        
        return `fetch('${request.url}', {
  method: '${request.method}',${headersStr ? `\n  headers: {\n${headersStr}\n  },` : ''}${bodyStr ? `\n${bodyStr}` : ''}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
    }
    
    // 生成Fetch (Node.js)
    generateFetchNode(request) {
        const headers = this.normalizeHeaders(request.headers);
        const hasBody = request.body && request.method !== 'GET' && request.method !== 'HEAD';
        
        let headersStr = '';
        if (headers && Object.keys(headers).length > 0) {
            headersStr = Object.entries(headers)
                .map(([key, value]) => {
                    const valueStr = String(value);
                    return `    '${key}': '${valueStr}'`;
                })
                .join(',\n');
        }
        
        let bodyStr = '';
        if (hasBody) {
            if (typeof request.body === 'object') {
                bodyStr = `  body: JSON.stringify(${JSON.stringify(request.body, null, 2)}),\n`;
            } else {
                bodyStr = `  body: '${String(request.body)}',\n`;
            }
        }
        
        return `const fetch = require('node-fetch');

fetch('${request.url}', {
  method: '${request.method}',${headersStr ? `\n  headers: {\n${headersStr}\n  },` : ''}${bodyStr ? `\n${bodyStr}` : ''}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
    }
    
    // 打开新增页面并填充数据
    openNewRequestWithData(requestData) {
        this.selectedRequest = null;
        this.modalTitle.textContent = '新建请求';
        
        // 填充基本信息
        this.editMethod.value = requestData.method;
        this.editUrl.value = requestData.url;
        
        // 清空所有动态行
        this.clearAllRows();
        
        // 预填充请求头
        if (requestData.headers) {
            this.prefillHeaders(requestData.headers);
        } else {
            this.addHeaderRow();
        }
        
        // 预填充请求体
        if (requestData.body) {
            this.prefillBody(requestData.body);
        }
        
        // 预填充URL参数
        if (requestData.params) {
            this.prefillParams(requestData.params);
        } else {
            this.addParamRow();
        }
        
        // 切换到参数tab
        this.switchTab('params');
        
        this.editModal.style.display = 'block';
    }
    
    // 复制请求功能
    duplicateRequest() {
        if (!this.selectedRequest) {
            this.showNotification('请先选择一个请求', 'warning');
            return;
        }
        
        const duplicated = {
            ...this.selectedRequest,
            id: this.generateId(),
            timestamp: Date.now(),
            isReplayed: false,
            isDuplicated: true,
            originalId: this.selectedRequest.id
        };
        
        this.requests.unshift(duplicated);
        this.updateUI();
        this.selectRequest(duplicated);
        this.showNotification('请求复制成功！', 'success');
    }
    
    // 保存编辑的请求
    saveEditedRequest() {
        try {
            const requestData = {
                id: this.selectedRequest?.id || this.generateId(),
                method: this.editMethod.value,
                url: this.editUrl.value,
                headers: this.collectHeaders(),
                body: this.collectBody(),
                timestamp: Date.now(),
                isCustom: true
            };
            
            // 验证URL
            if (!requestData.url.trim()) {
                this.showNotification('请输入有效的URL', 'error');
                return;
            }
            
            if (this.selectedRequest) {
                // 更新现有请求
                const index = this.requests.findIndex(r => r.id === this.selectedRequest.id);
                if (index !== -1) {
                    this.requests[index] = { ...this.requests[index], ...requestData };
                }
            } else {
                // 添加新请求
                this.requests.unshift(requestData);
            }
            
            this.updateUI();
            this.closeEditModal();
            this.showNotification('请求已保存', 'success');
        } catch (error) {
            this.showNotification('保存失败: ' + error.message, 'error');
        }
    }
    
    // 打开cURL导入模态框
    openCurlModal() {
        this.curlInput.value = '';
        this.curlModal.style.display = 'block';
    }
    
    // 关闭cURL模态框
    closeCurlModal() {
        this.curlModal.style.display = 'none';
    }
    
    // 导入cURL命令
    importCurlCommand() {
        const curlCommand = this.curlInput.value.trim();
        if (!curlCommand) {
            this.showNotification('请输入cURL命令', 'warning');
            return;
        }
        
        try {
            const requestData = this.parseCurl(curlCommand);
            
            this.closeCurlModal();
            
            // 打开新增页面并填充数据
            this.openNewRequestWithData(requestData);
            
            this.showNotification('cURL命令导入成功', 'success');
            
        } catch (error) {
            this.showNotification('cURL解析失败: ' + error.message, 'error');
        }
    }
    
    // 预填充请求头
    prefillHeaders(headers) {
        // 清空现有请求头行
        const headersList = document.getElementById('headersList');
        if (headersList) {
            headersList.innerHTML = '';
        }
        
        // 标准化headers格式
        const normalizedHeaders = this.normalizeHeaders(headers);
        
        // 添加请求头行
        Object.entries(normalizedHeaders).forEach(([key, value]) => {
            this.addHeaderRow();
            const rows = headersList.querySelectorAll('.header-row');
            const lastRow = rows[rows.length - 1];
            if (lastRow) {
                lastRow.querySelector('.header-key').value = key;
                // 确保value是字符串
                lastRow.querySelector('.header-value').value = typeof value === 'object' 
                    ? JSON.stringify(value) 
                    : String(value);
            }
        });
        
        // 同时填充raw模式
        if (this.editHeaders) {
            this.editHeaders.value = JSON.stringify(normalizedHeaders, null, 2);
        }
    }
    
    // 预填充请求体
    prefillBody(body) {
        if (this.editBody) {
            const bodyText = typeof body === 'string' 
                ? body 
                : JSON.stringify(body, null, 2);
            this.editBody.value = bodyText;
            
            // 检测并设置请求体类型
            try {
                JSON.parse(bodyText);
                document.getElementById('bodyType').value = 'json';
                this.updateBodyTypeIndicator('json');
            } catch (e) {
                document.getElementById('bodyType').value = 'raw';
                this.updateBodyTypeIndicator('raw');
            }
        }
    }
    
    // 预填充URL参数
    prefillParams(params) {
        const paramsList = document.getElementById('paramsList');
        if (paramsList) {
            paramsList.innerHTML = '';
        }
        
        Object.entries(params).forEach(([key, value]) => {
            this.addParamRow();
            const rows = paramsList.querySelectorAll('.param-row');
            const lastRow = rows[rows.length - 1];
            if (lastRow) {
                lastRow.querySelector('.param-key').value = key;
                lastRow.querySelector('.param-value').value = value;
            }
        });
    }
    
    // 检测并设置认证类型
    detectAndSetAuth(headers) {
        const authType = document.getElementById('authType');
        if (!authType) return;
        
        const normalizedHeaders = this.normalizeHeaders(headers);
        
        // 检测Authorization头
        const authHeader = normalizedHeaders['Authorization'] || normalizedHeaders['authorization'];
        
        if (authHeader) {
            if (authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                authType.value = 'bearer';
                this.switchAuthType('bearer');
                // 使用setTimeout确保DOM完全更新后再设置值
                setTimeout(() => {
                    const bearerToken = document.getElementById('bearerToken');
                    if (bearerToken) {
                        bearerToken.value = token;
                        console.log('Bearer Token已填充:', token);
                    } else {
                        console.error('bearerToken元素未找到');
                    }
                }, 50);
            } else if (authHeader.startsWith('Basic ')) {
                authType.value = 'basic';
                this.switchAuthType('basic');
                // Basic认证需要解码
                try {
                    const decoded = atob(authHeader.substring(6));
                    const [username, password] = decoded.split(':');
                    setTimeout(() => {
                        const basicUsername = document.getElementById('basicUsername');
                        const basicPassword = document.getElementById('basicPassword');
                        if (basicUsername) {
                            basicUsername.value = username || '';
                            console.log('Basic Auth用户名已填充:', username);
                        }
                        if (basicPassword) {
                            basicPassword.value = password || '';
                            console.log('Basic Auth密码已填充');
                        }
                        if (!basicUsername || !basicPassword) {
                            console.error('Basic Auth元素未找到');
                        }
                    }, 50);
                } catch (e) {
                    console.error('Basic认证解码失败:', e);
                }
            }
        } else {
            authType.value = 'none';
            this.switchAuthType('none');
        }
    }
    
    // 解析cURL命令
    parseCurl(curlCommand) {
        const result = {
            method: 'GET',
            url: '',
            headers: {},
            body: ''
        };
        
        // 移除curl前缀和换行符
        let cmd = curlCommand.replace(/^curl\s+/i, '').replace(/\\\s*\n\s*/g, ' ').trim();
        
        // 提取URL
        const urlMatch = cmd.match(/(?:^|\s)(?:'([^']*)'|"([^"]*)"|(\S+))/);
        if (urlMatch) {
            result.url = urlMatch[1] || urlMatch[2] || urlMatch[3];
            cmd = cmd.replace(urlMatch[0], '');
        }
        
        // 提取方法
        const methodMatch = cmd.match(/-X\s+(\w+)/i);
        if (methodMatch) {
            result.method = methodMatch[1].toUpperCase();
        }
        
        // 提取请求头
        const headerMatches = cmd.matchAll(/-H\s+(?:'([^']*)'|"([^"]*)"|(\S+))/gi);
        for (const match of headerMatches) {
            const header = match[1] || match[2] || match[3];
            const [key, ...valueParts] = header.split(':');
            if (key && valueParts.length > 0) {
                result.headers[key.trim()] = valueParts.join(':').trim();
            }
        }
        
        // 提取请求体
        const dataMatch = cmd.match(/--data(?:-raw)?\s+(?:'([^']*)'|"([^"]*)"|(\S+))/i);
        if (dataMatch) {
            result.body = dataMatch[1] || dataMatch[2] || dataMatch[3];
        }
        
        return result;
    }
    
    // 清空模态框输入
    clearModalInputs() {
        // 清空请求头
        if (this.editHeaders) {
            this.editHeaders.value = '{}';
        }
        
        // 清空请求体
        if (this.editBody) {
            this.editBody.value = '';
        }
        
        // 清空其他输入字段
        document.querySelectorAll('.header-row input, .form-field-row input, .param-row input').forEach(input => {
            input.value = '';
        });
    }
    
    // 清空所有动态行
    clearAllRows() {
        // 清空参数行
        const paramsList = document.getElementById('paramsList');
        if (paramsList) {
            paramsList.innerHTML = '';
        }
        
        // 清空请求头行
        const headersList = document.getElementById('headersList');
        if (headersList) {
            headersList.innerHTML = '';
        }
        
        // 清空表单字段行
        const formFieldsList = document.getElementById('formFieldsList');
        if (formFieldsList) {
            formFieldsList.innerHTML = '';
        }
    }
    
    // Tab切换功能
    switchTab(tabName) {
        // 移除所有active状态
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.style.display = 'none');
        
        // 激活选中的tab
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}Tab`);
        
        if (activeBtn && activeContent) {
            activeBtn.classList.add('active');
            activeContent.style.display = 'block';
        }
        
        // 初始化tab内容
        this.initializeTabContent(tabName);
    }
    
    // 初始化tab内容
    initializeTabContent(tabName) {
        switch (tabName) {
            case 'params':
                this.initializeParamsTab();
                break;
            case 'headers':
                this.initializeHeadersTab();
                break;
            case 'body':
                this.initializeBodyTab();
                break;
            case 'auth':
                this.initializeAuthTab();
                break;
        }
    }
    
    // 初始化参数tab
    initializeParamsTab() {
        const paramsList = document.getElementById('paramsList');
        if (paramsList && paramsList.children.length === 0) {
            this.addParamRow();
        }
    }
    
    // 初始化请求头tab
    initializeHeadersTab() {
        const headersList = document.getElementById('headersList');
        if (headersList && headersList.children.length === 0) {
            this.addHeaderRow();
        }
    }
    
    // 初始化请求体tab
    initializeBodyTab() {
        // 请求体tab已有内容，无需初始化
    }
    
    // 初始化认证tab
    initializeAuthTab() {
        // 如果已经初始化过，不再重复初始化
        if (this._authTabInitialized) {
            console.log('认证tab已初始化，跳过');
            return;
        }
        
        // 绑定认证类型选择器事件
        const authTypeSelect = document.getElementById('authType');
        if (authTypeSelect) {
            // 移除旧的事件监听器（如果有）
            const newAuthTypeSelect = authTypeSelect.cloneNode(true);
            authTypeSelect.parentNode.replaceChild(newAuthTypeSelect, authTypeSelect);
            
            newAuthTypeSelect.addEventListener('change', (e) => {
                this.switchAuthType(e.target.value);
            });
            
            // 检查是否有待处理的认证信息
            if (this._pendingAuthHeaders) {
                console.log('检测到待处理的认证信息，开始检测');
                this.detectAndSetAuth(this._pendingAuthHeaders);
                this._pendingAuthHeaders = null;
            } else {
                // 初始化为无认证
                this.switchAuthType('none');
            }
            
            // 标记为已初始化
            this._authTabInitialized = true;
        }
    }
    
    // 切换认证类型
    switchAuthType(authType) {
        const authContent = document.getElementById('authContent');
        
        if (!authContent) {
            console.error('authContent元素未找到！');
            return;
        }
        
        console.log('切换认证类型到:', authType);
        
        switch (authType) {
            case 'none':
                authContent.innerHTML = `
                    <div class="auth-none">
                        <i class="fas fa-shield-alt"></i>
                        <span>无需认证</span>
                    </div>
                `;
                break;
                
            case 'bearer':
                authContent.innerHTML = `
                    <div class="auth-form">
                        <div class="form-group">
                            <label><i class="fas fa-key"></i> Bearer Token</label>
                            <input type="text" id="bearerToken" class="form-control" placeholder="输入Bearer Token">
                            <small class="form-help">通常用于JWT认证</small>
                        </div>
                    </div>
                `;
                console.log('Bearer Token表单已生成');
                break;
                
            case 'basic':
                authContent.innerHTML = `
                    <div class="auth-form">
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> 用户名</label>
                            <input type="text" id="basicUsername" class="form-control" placeholder="输入用户名">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> 密码</label>
                            <input type="password" id="basicPassword" class="form-control" placeholder="输入密码">
                        </div>
                    </div>
                `;
                console.log('Basic Auth表单已生成');
                break;
                
            case 'api-key':
                authContent.innerHTML = `
                    <div class="auth-form">
                        <div class="form-group">
                            <label><i class="fas fa-tag"></i> Key名称</label>
                            <input type="text" id="apiKeyName" class="form-control" placeholder="例如: X-API-Key">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-key"></i> Key值</label>
                            <input type="text" id="apiKeyValue" class="form-control" placeholder="输入API Key值">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-map-marker-alt"></i> 添加位置</label>
                            <select id="apiKeyLocation" class="form-control">
                                <option value="header">请求头</option>
                                <option value="query">查询参数</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
                
            case 'oauth2':
                authContent.innerHTML = `
                    <div class="auth-form">
                        <div class="form-group">
                            <label><i class="fas fa-shield-alt"></i> Access Token</label>
                            <input type="text" id="oauth2Token" class="form-control" placeholder="输入OAuth2 Access Token">
                            <small class="form-help">OAuth2认证访问令牌</small>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-cog"></i> Token类型</label>
                            <select id="oauth2TokenType" class="form-control">
                                <option value="Bearer">Bearer</option>
                                <option value="MAC">MAC</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
                
            case 'digest':
                authContent.innerHTML = `
                    <div class="auth-form">
                        <div class="form-group">
                            <label><i class="fas fa-user"></i> 用户名</label>
                            <input type="text" id="digestUsername" class="form-control" placeholder="输入用户名">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-lock"></i> 密码</label>
                            <input type="password" id="digestPassword" class="form-control" placeholder="输入密码">
                        </div>
                        <small class="form-help">Digest认证比Basic认证更安全</small>
                    </div>
                `;
                break;
                
            case 'hawk':
                authContent.innerHTML = `
                    <div class="auth-form">
                        <div class="form-group">
                            <label><i class="fas fa-fingerprint"></i> Hawk ID</label>
                            <input type="text" id="hawkId" class="form-control" placeholder="输入Hawk ID">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-key"></i> Hawk Key</label>
                            <input type="text" id="hawkKey" class="form-control" placeholder="输入Hawk Key">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-code"></i> 算法</label>
                            <select id="hawkAlgorithm" class="form-control">
                                <option value="sha256">SHA-256</option>
                                <option value="sha1">SHA-1</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
        }
    }
    
    // 添加参数行
    addParamRow() {
        const paramsList = document.getElementById('paramsList');
        const row = document.createElement('div');
        row.className = 'param-row';
        row.innerHTML = `
            <input type="text" class="param-key" placeholder="参数名">
            <input type="text" class="param-value" placeholder="参数值">
            <button class="remove-btn" type="button">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // 添加删除事件
        const removeBtn = row.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            row.remove();
        });
        
        paramsList.appendChild(row);
    }
    
    // 添加请求头行
    addHeaderRow() {
        const headersList = document.getElementById('headersList');
        const row = document.createElement('div');
        row.className = 'header-row';
        row.innerHTML = `
            <input type="text" class="header-key" placeholder="请求头名称">
            <input type="text" class="header-value" placeholder="请求头值">
            <button class="remove-btn" type="button">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // 添加删除事件
        const removeBtn = row.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            row.remove();
        });
        
        headersList.appendChild(row);
    }
    
    // 切换请求头模式
    switchHeadersMode(mode) {
        // 只在编辑模态框中切换
        const modal = document.getElementById('editModal');
        if (!modal) return;
        
        // 切换按钮状态（只在模态框内）
        modal.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const targetBtn = modal.querySelector(`[data-mode="${mode}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // 切换显示内容（只在模态框内）
        const formMode = modal.querySelector('.headers-form-mode');
        const rawMode = modal.querySelector('.headers-raw-mode');
        
        if (formMode && rawMode) {
            if (mode === 'form') {
                formMode.style.display = 'block';
                rawMode.style.display = 'none';
            } else {
                formMode.style.display = 'none';
                rawMode.style.display = 'block';
            }
        }
    }
    
    // 初始化下拉菜单
    initializeDropdowns() {
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const dropdown = e.target.closest('.dropdown');
                const isActive = dropdown.classList.contains('active');
                
                // 关闭所有其他下拉菜单
                document.querySelectorAll('.dropdown').forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('active');
                    }
                });
                
                // 切换当前下拉菜单
                dropdown.classList.toggle('active', !isActive);
            });
        });
    }
    
    // 更新请求体类型指示器
    updateBodyTypeIndicator(bodyType) {
        const indicator = document.getElementById('bodyTypeIndicator');
        if (!indicator) return;
        
        const typeConfig = {
            'none': { icon: 'fa-ban', text: 'NONE', color: '#6b7280' },
            'json': { icon: 'fa-file-code', text: 'JSON', color: '#3b82f6' },
            'form': { icon: 'fa-list-alt', text: 'FORM', color: '#10b981' },
            'raw': { icon: 'fa-file-alt', text: 'RAW', color: '#f59e0b' },
            'binary': { icon: 'fa-file', text: 'BINARY', color: '#8b5cf6' }
        };
        
        const config = typeConfig[bodyType] || typeConfig.none;
        indicator.innerHTML = `<i class="fas ${config.icon}"></i> ${config.text}`;
        indicator.style.backgroundColor = config.color;
    }
    
    // 初始化UI
    initializeUI() {
        // 默认显示第一个tab
        this.switchTab('params');
        
        // 初始化请求体类型指示器
        this.updateBodyTypeIndicator('none');
        
        // 添加按钮事件绑定
        document.getElementById('addParamBtn')?.addEventListener('click', () => this.addParamRow());
        document.getElementById('addHeaderBtn')?.addEventListener('click', () => this.addHeaderRow());
        
        // 绑定格式化和压缩按钮
        document.getElementById('formatJsonBtn')?.addEventListener('click', () => this.formatJson());
        document.getElementById('minifyJsonBtn')?.addEventListener('click', () => this.minifyJson());
    }
    
    // 格式化JSON
    formatJson() {
        const bodyJson = document.getElementById('editBodyJson');
        if (!bodyJson) return;
        
        try {
            const text = bodyJson.value.trim();
            if (!text) {
                this.showNotification('请求体为空', 'warning');
                return;
            }
            
            const parsed = JSON.parse(text);
            bodyJson.value = JSON.stringify(parsed, null, 2);
            this.showNotification('JSON已格式化', 'success');
        } catch (error) {
            this.showNotification('JSON格式错误: ' + error.message, 'error');
        }
    }
    
    // 压缩JSON
    minifyJson() {
        const bodyJson = document.getElementById('editBodyJson');
        if (!bodyJson) return;
        
        try {
            const text = bodyJson.value.trim();
            if (!text) {
                this.showNotification('请求体为空', 'warning');
                return;
            }
            
            const parsed = JSON.parse(text);
            bodyJson.value = JSON.stringify(parsed);
            this.showNotification('JSON已压缩', 'success');
        } catch (error) {
            this.showNotification('JSON格式错误: ' + error.message, 'error');
        }
    }
    
    // 打开代码生成器
    openCodeGenerator(requestId) {
        const request = this.requests.find(r => r.id === requestId) || this.selectedRequest;
        if (!request) {
            this.showNotification('请先选择一个请求', 'warning');
            return;
        }
        
        this.currentCodeRequest = request;
        this.codeModal.style.display = 'block';
        this.generateCode();
    }
    
    // 关闭代码生成器
    closeCodeGenerator() {
        this.codeModal.style.display = 'none';
        this.currentCodeRequest = null;
    }
    
    // 生成代码
    generateCode() {
        if (!this.currentCodeRequest) return;
        
        const language = this.codeLanguage.value;
        const request = this.currentCodeRequest;
        
        let code = '';
        
        switch (language) {
            case 'javascript':
                code = this.generateJavaScriptCode(request);
                break;
            case 'curl':
                code = this.generateCurlCode(request);
                break;
            case 'python':
                code = this.generatePythonCode(request);
                break;
            case 'java':
                code = this.generateJavaCode(request);
                break;
            case 'csharp':
                code = this.generateCSharpCode(request);
                break;
            case 'php':
                code = this.generatePHPCode(request);
                break;
            case 'go':
                code = this.generateGoCode(request);
                break;
            case 'ruby':
                code = this.generateRubyCode(request);
                break;
            default:
                code = '// 不支持的语言';
        }
        
        this.generatedCode.value = code;
    }
    
    // 生成JavaScript代码
    generateJavaScriptCode(request) {
        const headers = request.headers || {};
        const hasBody = request.body && request.method !== 'GET';
        
        let headersStr = '';
        if (Object.keys(headers).length > 0) {
            headersStr = Object.entries(headers)
                .map(([key, value]) => `    '${key}': '${value}'`)
                .join(',\n');
        }
        
        let bodyStr = '';
        if (hasBody) {
            if (typeof request.body === 'object') {
                bodyStr = `  body: JSON.stringify(${JSON.stringify(request.body, null, 2)}),\n`;
            } else {
                bodyStr = `  body: '${request.body}',\n`;
            }
        }
        
        return `fetch('${request.url}', {
  method: '${request.method}',${headersStr ? `\n  headers: {\n${headersStr}\n  },` : ''}${bodyStr ? `\n${bodyStr}` : ''}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
    }
    
    // 生成cURL代码
    generateCurlCode(request) {
        let curl = `curl -X ${request.method} '${request.url}'`;
        
        if (request.headers) {
            Object.entries(request.headers).forEach(([key, value]) => {
                curl += ` \\\n  -H '${key}: ${value}'`;
            });
        }
        
        if (request.body && request.method !== 'GET') {
            if (typeof request.body === 'object') {
                curl += ` \\\n  -d '${JSON.stringify(request.body)}'`;
            } else {
                curl += ` \\\n  -d '${request.body}'`;
            }
        }
        
        return curl;
    }
    
    // 生成Python代码
    generatePythonCode(request) {
        const headers = request.headers || {};
        const hasBody = request.body && request.method !== 'GET';
        
        let headersStr = '';
        if (Object.keys(headers).length > 0) {
            headersStr = Object.entries(headers)
                .map(([key, value]) => `    '${key}': '${value}'`)
                .join(',\n');
        }
        
        let bodyStr = '';
        if (hasBody) {
            if (typeof request.body === 'object') {
                bodyStr = `data = ${JSON.stringify(request.body, null, 2)}\n`;
            } else {
                bodyStr = `data = '${request.body}'\n`;
            }
        }
        
        return `import requests

url = '${request.url}'${headersStr ? `\nheaders = {\n${headersStr}\n}` : ''}
${bodyStr}
response = requests.${request.method.toLowerCase()}(url${headersStr ? ', headers=headers' : ''}${hasBody ? ', json=data' : ''})

print(response.status_code)
print(response.json())`;
    }
    
    // 复制生成的代码
    copyGeneratedCode() {
        const code = this.generatedCode.value;
        if (!code) {
            this.showNotification('没有代码可复制', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(code).then(() => {
            this.showNotification('代码已复制到剪贴板', 'success');
        }).catch(() => {
            this.showNotification('复制失败', 'error');
        });
    }
    
    // 下载生成的代码
    downloadGeneratedCode() {
        const code = this.generatedCode.value;
        const language = this.codeLanguage.value;
        
        if (!code) {
            this.showNotification('没有代码可下载', 'warning');
            return;
        }
        
        const extensions = {
            javascript: 'js',
            python: 'py',
            java: 'java',
            csharp: 'cs',
            php: 'php',
            go: 'go',
            ruby: 'rb',
            curl: 'sh'
        };
        
        const ext = extensions[language] || 'txt';
        const filename = `api-request.${ext}`;
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`代码已下载为 ${filename}`, 'success');
    }
    
    // 格式化生成的代码
    formatGeneratedCode() {
        // 简单的格式化，主要是整理缩进
        const code = this.generatedCode.value;
        if (!code) return;
        
        // 这里可以添加更复杂的格式化逻辑
        this.showNotification('代码已格式化', 'success');
    }
    
    // 生成其他语言的代码（简化版本）
    generateJavaCode(request) {
        return `// Java (OkHttp) - 需要添加OkHttp依赖
OkHttpClient client = new OkHttpClient();

Request request = new Request.Builder()
    .url("${request.url}")
    .${request.method.toLowerCase()}()
    .build();

try (Response response = client.newCall(request).execute()) {
    System.out.println(response.body().string());
}`;
    }
    
    generateCSharpCode(request) {
        return `// C# (HttpClient)
using System;
using System.Net.Http;
using System.Threading.Tasks;

var client = new HttpClient();
var response = await client.${request.method === 'GET' ? 'GetAsync' : 'PostAsync'}("${request.url}");
var content = await response.Content.ReadAsStringAsync();
Console.WriteLine(content);`;
    }
    
    generatePHPCode(request) {
        return `<?php
// PHP (cURL)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${request.url}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${request.method}');

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;
    }
    
    generateGoCode(request) {
        return `// Go (net/http)
package main

import (
    "fmt"
    "net/http"
    "io/ioutil"
)

func main() {
    resp, err := http.${request.method === 'GET' ? 'Get' : 'Post'}("${request.url}")
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        panic(err)
    }
    
    fmt.Println(string(body))
}`;
    }
    
    generateRubyCode(request) {
        return `# Ruby (Net::HTTP)
require 'net/http'
require 'uri'

uri = URI('${request.url}')
response = Net::HTTP.${request.method.toLowerCase()}_response(uri)
puts response.body`;
    }
}

// JSONTreeView - JSON树形结构展示组件
class JSONTreeView {
    constructor(data, container, expandAll = true) {
        this.data = data;
        this.container = container;
        this.expandAll = expandAll;
        this.expandedPaths = new Set(); // 跟踪展开的节点
    }
    
    // 渲染树形结构
    render() {
        try {
            const parsed = typeof this.data === 'string' 
                ? JSON.parse(this.data) 
                : this.data;
            
            // 如果需要全部展开，收集所有路径
            if (this.expandAll) {
                this.collectAllPaths(parsed, 'root');
            }
            
            this.container.innerHTML = this.renderNode(parsed, '', null);
            this.bindEvents();
        } catch (error) {
            // 如果不是有效的JSON，回退到纯文本显示
            this.container.innerHTML = `<pre class="json-text-fallback">${this.escapeHtml(String(this.data))}</pre>`;
        }
    }
    
    // 收集所有路径用于展开
    collectAllPaths(value, path) {
        this.expandedPaths.add(path);
        
        if (Array.isArray(value)) {
            value.forEach((item, i) => {
                if (typeof item === 'object' && item !== null) {
                    this.collectAllPaths(item, `${path}[${i}]`);
                }
            });
        } else if (typeof value === 'object' && value !== null) {
            Object.keys(value).forEach(key => {
                if (typeof value[key] === 'object' && value[key] !== null) {
                    this.collectAllPaths(value[key], `${path}.${key}`);
                }
            });
        }
    }
    
    // 渲染单个节点
    renderNode(value, path, key = null) {
        const type = this.getType(value);
        
        switch (type) {
            case 'object':
                return this.renderObject(value, path, key);
            case 'array':
                return this.renderArray(value, path, key);
            default:
                return this.renderPrimitive(value, key);
        }
    }
    
    // 渲染对象
    renderObject(obj, path, key) {
        const keys = Object.keys(obj);
        const nodePath = path || 'root';
        const isExpanded = this.expandedPaths.has(nodePath);
        
        return `
            <div class="json-node json-object">
                <span class="json-toggle" data-path="${nodePath}">
                    <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
                </span>
                ${key !== null ? `<span class="json-key">${this.escapeHtml(String(key))}:</span>` : ''}
                <span class="json-bracket">{</span>
                <span class="json-count">${keys.length} ${keys.length === 1 ? 'property' : 'properties'}</span>
                <div class="json-children" style="display: ${isExpanded ? 'block' : 'none'}">
                    ${keys.map(k => this.renderNode(obj[k], `${nodePath}.${k}`, k)).join('')}
                </div>
                <span class="json-bracket">}</span>
            </div>
        `;
    }
    
    // 渲染数组
    renderArray(arr, path, key) {
        const nodePath = path || 'root';
        const isExpanded = this.expandedPaths.has(nodePath);
        
        return `
            <div class="json-node json-array">
                <span class="json-toggle" data-path="${nodePath}">
                    <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
                </span>
                ${key !== null ? `<span class="json-key">${this.escapeHtml(String(key))}:</span>` : ''}
                <span class="json-bracket">[</span>
                <span class="json-count">${arr.length} ${arr.length === 1 ? 'item' : 'items'}</span>
                <div class="json-children" style="display: ${isExpanded ? 'block' : 'none'}">
                    ${arr.map((item, i) => this.renderNode(item, `${nodePath}[${i}]`, `[${i}]`)).join('')}
                </div>
                <span class="json-bracket">]</span>
            </div>
        `;
    }
    
    // 渲染基本类型
    renderPrimitive(value, key) {
        const type = typeof value;
        let displayValue = String(value);
        let valueClass = `json-${type}`;
        
        if (value === null) {
            displayValue = 'null';
            valueClass = 'json-null';
        } else if (type === 'string') {
            displayValue = `"${this.escapeHtml(value)}"`;
        } else if (type === 'boolean') {
            valueClass = value ? 'json-true' : 'json-false';
        }
        
        return `
            <div class="json-node json-primitive">
                ${key !== null ? `<span class="json-key">${this.escapeHtml(String(key))}:</span>` : ''}
                <span class="json-value ${valueClass}">${displayValue}</span>
            </div>
        `;
    }
    
    // 绑定展开/折叠事件
    bindEvents() {
        this.container.querySelectorAll('.json-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = e.currentTarget.dataset.path;
                this.toggleNode(path);
            });
        });
    }
    
    // 切换节点展开/折叠状态
    toggleNode(path) {
        const toggle = this.container.querySelector(`[data-path="${path}"]`);
        const node = toggle ? toggle.closest('.json-node') : null;
        
        if (!node) return;
        
        const children = node.querySelector('.json-children');
        const icon = toggle.querySelector('i');
        
        if (!children || !icon) return;
        
        if (this.expandedPaths.has(path)) {
            this.expandedPaths.delete(path);
            children.style.display = 'none';
            icon.className = 'fas fa-chevron-right';
        } else {
            this.expandedPaths.add(path);
            children.style.display = 'block';
            icon.className = 'fas fa-chevron-down';
        }
    }
    
    // 获取值的类型
    getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// CollapsibleSection - 可折叠区域组件
class CollapsibleSection {
    constructor(sectionId, title, content, actions = '') {
        this.sectionId = sectionId;
        this.title = title;
        this.content = content;
        this.actions = actions;
        this.isCollapsed = false;
    }
    
    // 渲染可折叠区域
    render() {
        return `
            <div class="detail-section collapsible-section" data-section-id="${this.sectionId}">
                <div class="section-header">
                    <button class="collapse-toggle" data-section="${this.sectionId}">
                        <i class="fas fa-chevron-${this.isCollapsed ? 'right' : 'down'}"></i>
                    </button>
                    <h4>${this.title}</h4>
                    <div class="section-actions">
                        ${this.actions}
                    </div>
                </div>
                <div class="section-content" style="display: ${this.isCollapsed ? 'none' : 'block'}">
                    ${this.content}
                </div>
            </div>
        `;
    }
    
    // 切换折叠状态
    toggle() {
        this.isCollapsed = !this.isCollapsed;
    }
    
    // 绑定事件
    static bindEvents(container) {
        container.querySelectorAll('.collapse-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const sectionId = e.currentTarget.dataset.section;
                const section = container.querySelector(`[data-section-id="${sectionId}"]`);
                if (section) {
                    const content = section.querySelector('.section-content');
                    const icon = toggle.querySelector('i');
                    
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        icon.className = 'fas fa-chevron-down';
                    } else {
                        content.style.display = 'none';
                        icon.className = 'fas fa-chevron-right';
                    }
                }
            });
        });
    }
}

// SelectionManager - 管理请求选择状态和视觉反馈
class SelectionManager {
    constructor() {
        this.selectedRequestId = null;
    }
    
    // 选择请求
    selectRequest(requestId, method) {
        this.selectedRequestId = requestId;
        this.updateVisualFeedback(requestId, method);
    }
    
    // 更新视觉反馈
    updateVisualFeedback(requestId, method) {
        // 移除所有选中状态
        document.querySelectorAll('.request-item').forEach(item => {
            item.classList.remove('selected');
            item.style.backgroundColor = '';
            item.style.borderLeftColor = '';
            item.style.borderLeftWidth = '';
            item.style.borderLeftStyle = '';
        });
        
        // 添加新的选中状态
        const selectedItem = document.querySelector(`[data-id="${requestId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            
            // 根据HTTP方法设置强调色
            const accentColor = this.getMethodAccentColor(method);
            selectedItem.style.backgroundColor = this.addAlpha(accentColor, 0.1);
            selectedItem.style.borderLeftColor = accentColor;
            selectedItem.style.borderLeftWidth = '3px';
            selectedItem.style.borderLeftStyle = 'solid';
        }
    }
    
    // 获取HTTP方法的强调色
    getMethodAccentColor(method) {
        const colors = {
            'GET': '#10b981',      // 绿色 - 与method-get一致
            'POST': '#3b82f6',     // 蓝色 - 与method-post一致
            'PUT': '#f59e0b',      // 橙色 - 与method-put一致
            'DELETE': '#ef4444',   // 红色 - 与method-delete一致
            'PATCH': '#8b5cf6',    // 紫色 - 与method-patch一致
            'HEAD': '#6b7280',     // 灰色 - 与method-head一致
            'OPTIONS': '#f97316'   // 深橙色 - 与method-options一致
        };
        return colors[method] || '#6b7280';
    }
    
    // 添加透明度
    addAlpha(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// HeadersViewSwitcher - 请求头/响应头视图切换组件
class HeadersViewSwitcher {
    constructor(headers, container, sectionId) {
        this.headers = headers;
        this.container = container;
        this.sectionId = sectionId;
        this.currentMode = 'formatted'; // 'formatted' or 'raw'
    }
    
    // 渲染视图切换器
    render() {
        this.container.innerHTML = `
            <div class="view-switcher">
                <button class="view-btn ${this.currentMode === 'formatted' ? 'active' : ''}" 
                        data-mode="formatted" data-section="${this.sectionId}">
                    <i class="fas fa-list"></i> 格式化
                </button>
                <button class="view-btn ${this.currentMode === 'raw' ? 'active' : ''}" 
                        data-mode="raw" data-section="${this.sectionId}">
                    <i class="fas fa-code"></i> 原始
                </button>
            </div>
            <div class="view-content">
                ${this.renderCurrentView()}
            </div>
        `;
        this.bindEvents();
    }
    
    // 渲染当前视图
    renderCurrentView() {
        return this.currentMode === 'formatted' 
            ? this.renderFormattedView() 
            : this.renderRawView();
    }
    
    // 渲染格式化视图
    renderFormattedView() {
        const entries = this.getHeaderEntries();
        if (entries.length === 0) {
            return '<div class="empty-state">无请求头</div>';
        }
        
        return `
            <div class="headers-formatted">
                ${entries.map(([key, value]) => `
                    <div class="header-item">
                        <div class="header-name">${this.escapeHtml(key)}:</div>
                        <div class="header-value">${this.escapeHtml(String(value))}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 渲染原始视图
    renderRawView() {
        const entries = this.getHeaderEntries();
        if (entries.length === 0) {
            return '<div class="empty-state">无请求头</div>';
        }
        
        const rawText = entries.map(([key, value]) => `${key}: ${value}`).join('\n');
        return `
            <div class="headers-raw">
                <pre>${this.escapeHtml(rawText)}</pre>
            </div>
        `;
    }
    
    // 获取请求头条目
    getHeaderEntries() {
        if (!this.headers) return [];
        
        if (Array.isArray(this.headers)) {
            return this.headers.map(h => [h.name || h.key, h.value]);
        } else if (typeof this.headers === 'object' && this.headers !== null) {
            return Object.entries(this.headers);
        } else if (typeof this.headers === 'string') {
            try {
                const parsed = JSON.parse(this.headers);
                if (typeof parsed === 'object' && parsed !== null) {
                    return Object.entries(parsed);
                }
            } catch (error) {
                // 解析失败，返回空数组
            }
        }
        return [];
    }
    
    // 切换视图模式
    switchMode(mode) {
        this.currentMode = mode;
        this.render();
    }
    
    // 绑定事件
    bindEvents() {
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                const section = e.currentTarget.dataset.section;
                if (section === this.sectionId) {
                    this.switchMode(mode);
                }
            });
        });
    }
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// BodyViewSwitcher - 请求体/响应体视图切换组件
class BodyViewSwitcher {
    constructor(body, container, sectionId) {
        this.body = body;
        this.container = container;
        this.sectionId = sectionId;
        this.currentMode = 'formatted'; // 'formatted' or 'raw'
    }
    
    // 渲染视图切换器
    render() {
        this.container.innerHTML = `
            <div class="view-switcher">
                <button class="view-btn ${this.currentMode === 'formatted' ? 'active' : ''}" 
                        data-mode="formatted" data-section="${this.sectionId}">
                    <i class="fas fa-list"></i> 格式化
                </button>
                <button class="view-btn ${this.currentMode === 'raw' ? 'active' : ''}" 
                        data-mode="raw" data-section="${this.sectionId}">
                    <i class="fas fa-code"></i> 原始
                </button>
            </div>
            <div class="view-content">
                ${this.renderCurrentView()}
            </div>
        `;
        this.bindEvents();
    }
    
    // 渲染当前视图
    renderCurrentView() {
        return this.currentMode === 'formatted' 
            ? this.renderFormattedView() 
            : this.renderRawView();
    }
    
    // 渲染格式化视图（JSON树）
    renderFormattedView() {
        const container = document.createElement('div');
        container.className = 'json-tree-container';
        
        try {
            const parsed = typeof this.body === 'string' 
                ? JSON.parse(this.body) 
                : this.body;
            
            // 创建临时容器用于渲染
            const tempDiv = document.createElement('div');
            const tree = new JSONTreeView(parsed, tempDiv, true); // true = 默认展开所有
            tree.render();
            
            return tempDiv.innerHTML;
        } catch (error) {
            // 如果不是JSON，显示纯文本
            return `<pre class="json-text-fallback">${this.escapeHtml(String(this.body))}</pre>`;
        }
    }
    
    // 渲染原始视图（紧凑JSON）
    renderRawView() {
        try {
            const parsed = typeof this.body === 'string' 
                ? JSON.parse(this.body) 
                : this.body;
            
            // 紧凑格式，无缩进
            const rawText = JSON.stringify(parsed);
            return `
                <div class="body-raw">
                    <pre>${this.escapeHtml(rawText)}</pre>
                </div>
            `;
        } catch (error) {
            // 如果不是JSON，直接显示
            return `
                <div class="body-raw">
                    <pre>${this.escapeHtml(String(this.body))}</pre>
                </div>
            `;
        }
    }
    
    // 切换视图模式
    switchMode(mode) {
        this.currentMode = mode;
        this.render();
    }
    
    // 绑定事件
    bindEvents() {
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                const section = e.currentTarget.dataset.section;
                if (section === this.sectionId) {
                    this.switchMode(mode);
                }
            });
        });
        
        // 重新绑定JSON树的事件
        if (this.currentMode === 'formatted') {
            this.container.querySelectorAll('.json-toggle').forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const path = e.currentTarget.dataset.path;
                    this.toggleNode(e.currentTarget);
                });
            });
        }
    }
    
    // 切换节点展开/折叠
    toggleNode(toggle) {
        const node = toggle.closest('.json-node');
        if (!node) return;
        
        const children = node.querySelector('.json-children');
        const icon = toggle.querySelector('i');
        
        if (!children || !icon) return;
        
        if (children.style.display === 'none') {
            children.style.display = 'block';
            icon.className = 'fas fa-chevron-down';
        } else {
            children.style.display = 'none';
            icon.className = 'fas fa-chevron-right';
        }
    }
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// CopyManager - 统一管理复制操作
class CopyManager {
    // 复制基本信息
    static async copyBasicInfo(request) {
        const info = this.formatBasicInfo(request);
        return this.copyToClipboard(info);
    }
    
    // 复制请求头
    static async copyRequestHeaders(request) {
        if (!request || !request.headers) {
            throw new Error('请求头为空');
        }
        const headers = typeof request.headers === 'object' 
            ? JSON.stringify(request.headers, null, 2)
            : request.headers;
        return this.copyToClipboard(headers);
    }
    
    // 复制请求体
    static async copyRequestBody(request) {
        if (!request || !request.body) {
            throw new Error('请求体为空');
        }
        const body = typeof request.body === 'object' 
            ? JSON.stringify(request.body, null, 2) 
            : request.body;
        return this.copyToClipboard(body);
    }
    
    // 复制响应头
    static async copyResponseHeaders(request) {
        if (!request || !request.response || !request.response.headers) {
            throw new Error('响应头为空');
        }
        const headers = typeof request.response.headers === 'object'
            ? JSON.stringify(request.response.headers, null, 2)
            : request.response.headers;
        return this.copyToClipboard(headers);
    }
    
    // 复制响应体
    static async copyResponseBody(request) {
        if (!request || !request.response || !request.response.body) {
            throw new Error('响应体为空');
        }
        const body = typeof request.response.body === 'object' 
            ? JSON.stringify(request.response.body, null, 2) 
            : request.response.body;
        return this.copyToClipboard(body);
    }
    
    // 格式化基本信息
    static formatBasicInfo(request) {
        try {
            const urlObj = new URL(request.url);
            const name = this.extractName(request.url);
            const type = this.getRequestType(request);
            
            // 获取远程地址 - 先从URL解析，再从响应头覆盖
            const port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');
            let remoteAddress = `${urlObj.hostname}:${port}`;
            
            if (request.response && request.response.headers) {
                if (request.response.headers['x-forwarded-for']) {
                    remoteAddress = request.response.headers['x-forwarded-for'];
                } else if (request.response.headers['x-real-ip']) {
                    remoteAddress = request.response.headers['x-real-ip'];
                }
            }
            
            // 获取引用站点策略
            let referrerPolicy = 'strict-origin-when-cross-origin';
            if (request.headers && request.headers['referrer-policy']) {
                referrerPolicy = request.headers['referrer-policy'];
            } else if (request.response && request.response.headers && request.response.headers['referrer-policy']) {
                referrerPolicy = request.response.headers['referrer-policy'];
            } else if (request.referrerPolicy) {
                referrerPolicy = request.referrerPolicy;
            }
            
            // 检查是否有编码的参数
            const hasEncodedParams = request.url.includes('%') && request.url !== decodeURIComponent(request.url);
            const decodedUrl = hasEncodedParams ? decodeURIComponent(request.url) : null;
            
            let basicInfo = `名称: ${name}
类型: ${type}
方法: ${request.method}
URL: ${request.url}`;
            
            if (decodedUrl) {
                basicInfo += `\nURL (解码): ${decodedUrl}`;
            }
            
            basicInfo += `
远程地址: ${remoteAddress}
状态: ${request.response ? `${request.response.status} ${request.response.statusText}` : 'Pending'}
时间: ${new Date(request.timestamp).toLocaleString()}`;
            
            if (request.duration) {
                basicInfo += `\n耗时: ${request.duration}ms`;
            }
            
            basicInfo += `\n引用站点策略: ${referrerPolicy}`;
            
            return basicInfo.trim();
        } catch (error) {
            console.error('格式化基本信息失败:', error);
            return `方法: ${request.method}
URL: ${request.url}
状态: ${request.response ? `${request.response.status} ${request.response.statusText}` : 'Pending'}
时间: ${new Date(request.timestamp).toLocaleString()}`.trim();
        }
    }
    
    // 提取请求名称
    static extractName(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            return pathParts[pathParts.length - 1] || urlObj.hostname;
        } catch {
            return url;
        }
    }
    
    // 获取请求类型
    static getRequestType(request) {
        if (request.isReplayed) return '🔄 重放请求';
        if (request.isCustom) return '✏️ 自定义请求';
        if (request.isImported) return '📋 导入请求';
        return '🔍 自动捕获';
    }
    
    // 复制到剪贴板
    static async copyToClipboard(text) {
        return navigator.clipboard.writeText(text);
    }
}

// 初始化面板
document.addEventListener('DOMContentLoaded', () => {
    new ApiDebuggerPanel();
});
