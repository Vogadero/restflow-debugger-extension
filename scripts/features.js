// RestFlow 新功能扩展

// 新建请求功能
function newRequest() {
    this.selectedRequest = null;
    this.modalTitle.textContent = '新建请求';
    this.editMethod.value = 'GET';
    this.editUrl.value = '';
    this.clearModalInputs();
    this.editModal.style.display = 'block';
}

// 复制请求功能
function duplicateRequest() {
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

// 打开cURL导入模态框
function openCurlModal() {
    this.curlInput.value = '';
    this.curlModal.style.display = 'block';
}

// 关闭cURL模态框
function closeCurlModal() {
    this.curlModal.style.display = 'none';
}

// 修复方法名冲突
function closeCurlModalFixed() {
    this.curlModal.style.display = 'none';
}

// 导入cURL命令
function importCurlCommand() {
    const curlCommand = this.curlInput.value.trim();
    if (!curlCommand) {
        this.showNotification('请输入cURL命令', 'error');
        return;
    }
    
    try {
        const parsed = this.parseCurl(curlCommand);
        
        // 创建新请求
        const newRequest = {
            id: this.generateId(),
            timestamp: Date.now(),
            url: parsed.url,
            method: parsed.method,
            headers: parsed.headers,
            body: parsed.body,
            isCustom: true
        };
        
        this.requests.unshift(newRequest);
        this.updateUI();
        this.selectRequest(newRequest);
        this.closeCurlModal();
        this.showNotification('cURL导入成功', 'success');
        
    } catch (error) {
        this.showNotification('cURL解析失败: ' + error.message, 'error');
    }
}

// 解析cURL命令
function parseCurl(curlCommand) {
    // 简化的cURL解析器
    const result = {
        method: 'GET',
        url: '',
        headers: {},
        body: null
    };
    
    // 移除换行符和多余空格
    const cleaned = curlCommand.replace(/\\\s*\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 提取URL
    const urlMatch = cleaned.match(/curl\s+(?:-[^\s]+\s+)*['"]?([^'"\s]+)['"]?/);
    if (urlMatch) {
        result.url = urlMatch[1];
    }
    
    // 提取方法
    const methodMatch = cleaned.match(/-X\s+([A-Z]+)/i);
    if (methodMatch) {
        result.method = methodMatch[1].toUpperCase();
    }
    
    // 提取请求头
    const headerMatches = cleaned.matchAll(/-H\s+['"]([^'"]+)['"]/g);
    for (const match of headerMatches) {
        const [key, value] = match[1].split(':').map(s => s.trim());
        if (key && value) {
            result.headers[key] = value;
        }
    }
    
    // 提取请求体
    const dataMatch = cleaned.match(/-d\s+['"]([^'"]+)['"]/);
    if (dataMatch) {
        result.body = dataMatch[1];
    }
    
    if (!result.url) {
        throw new Error('无法解析URL');
    }
    
    return result;
}

// 清空模态框输入
function clearModalInputs() {
    // 清空所有输入字段
    const inputs = this.editModal.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
}

// 保存编辑的请求
function saveEditedRequest() {
    try {
        const requestData = this.collectRequestData();
        
        if (this.selectedRequest) {
            // 更新现有请求
            Object.assign(this.selectedRequest, requestData);
            this.showNotification('请求已更新', 'success');
        } else {
            // 创建新请求
            const newRequest = {
                id: this.generateId(),
                timestamp: Date.now(),
                isCustom: true,
                ...requestData
            };
            
            this.requests.unshift(newRequest);
            this.selectRequest(newRequest);
            this.showNotification('请求已创建', 'success');
        }
        
        this.updateUI();
        this.closeEditModal();
        
    } catch (error) {
        this.showNotification('保存失败: ' + error.message, 'error');
    }
}

// 收集请求数据
function collectRequestData() {
    return {
        method: this.editMethod.value,
        url: this.editUrl.value.trim(),
        headers: this.collectHeaders(),
        body: this.collectBody()
    };
}

// 收集请求头
function collectHeaders() {
    const headers = {};
    
    // 从表单模式收集
    const headerRows = document.querySelectorAll('.header-row');
    headerRows.forEach(row => {
        const key = row.querySelector('.header-key').value.trim();
        const value = row.querySelector('.header-value').value.trim();
        if (key && value) {
            headers[key] = value;
        }
    });
    
    return headers;
}

// 收集请求体
function collectBody() {
    const bodyType = document.getElementById('bodyType').value;
    
    switch (bodyType) {
        case 'json':
            return document.getElementById('editBodyJson').value.trim();
        case 'form':
            return this.collectFormData();
        case 'raw':
            return document.getElementById('editBodyRaw').value.trim();
        default:
            return null;
    }
}

// 收集表单数据
function collectFormData() {
    const formData = {};
    const formRows = document.querySelectorAll('.form-field-row');
    
    formRows.forEach(row => {
        const key = row.querySelector('.form-key').value.trim();
        const value = row.querySelector('.form-value').value.trim();
        if (key && value) {
            formData[key] = value;
        }
    });
    
    return JSON.stringify(formData);
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 将这些方法添加到ApiDebuggerPanel类的原型
Object.assign(window.ApiDebuggerPanel.prototype, {
    newRequest,
    duplicateRequest,
    openCurlModal,
    closeCurlModal,
    importCurlCommand,
    parseCurl,
    clearModalInputs,
    saveEditedRequest,
    collectRequestData,
    collectHeaders,
    collectBody,
    collectFormData,
    generateId
});
