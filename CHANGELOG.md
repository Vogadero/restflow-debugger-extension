# RestFlow 更新日志

## 最新版本

### 核心功能优化

#### 1. 请求捕获与展示
- ✅ 智能去重机制 - 500ms窗口内的重复请求自动过滤
- ✅ 只显示完整请求 - 过滤未完成的请求（必须有响应和耗时）
- ✅ 名称智能提取 - 显示URL路径的最后一段（如`tree`而不是完整路径）
- ✅ 远程地址解析 - 正确显示主机名和端口（如`cyan.mediinfo.cn:443`）

#### 2. 查询参数支持
- ✅ GET请求参数展示 - 独立的查询参数区域
- ✅ 参数格式化/原始视图 - 支持两种展示模式
- ✅ 参数复制功能 - 一键复制查询参数
- ✅ URL解码显示 - 自动解码中文等编码字符

#### 3. 代码生成器
- ✅ 多格式支持 - cURL (CMD/Bash)、PowerShell、Fetch、Fetch (Node.js)
- ✅ 下拉菜单 - 点击复制按钮显示格式选择菜单
- ✅ 智能生成 - 根据请求自动生成对应代码

#### 4. 复制功能优化
- ✅ 视图模式感知 - 根据当前视图（格式化/原始）输出不同格式
- ✅ 格式化模式 - 复制带缩进和换行的JSON（`JSON.stringify(data, null, 2)`）
- ✅ 原始模式 - 复制紧凑的JSON（`JSON.stringify(data)`）
- ✅ 备用复制方案 - 解决Clipboard API权限问题

#### 5. 搜索与过滤
- ✅ 搜索清空按钮 - 有值时自动显示，一键清空
- ✅ Emoji图标 - 所有下拉选项使用emoji+文字展示
- ✅ 颜色统一 - 选中状态颜色与请求方法颜色一致
- ✅ 多维度过滤 - 方法、状态、类型三重过滤

#### 6. 编辑功能增强
- ✅ 认证信息预填 - 自动检测并填充Bearer Token、Basic Auth（延迟加载确保DOM就绪）
- ✅ 请求体类型检测 - 自动识别JSON并设置对应类型
- ✅ Headers格式修复 - 解决[object Object]显示问题
- ✅ 格式化/压缩按钮 - JSON一键格式化和压缩
- ✅ 表单/Raw切换修复 - 不影响请求详情的视图切换
- ✅ 模态框显示时机 - 先显示模态框再填充认证信息

#### 7. UI/UX改进
- ✅ 折叠icon对齐 - 完美的垂直对齐
- ✅ 容器溢出修复 - 多层CSS容器的宽度限制
- ✅ 下拉框优化 - 移除冲突动画，防止漂移
- ✅ 模态框尺寸 - 增大尺寸提供更多空间
- ✅ 刷新按钮 - 重新加载页面并自动捕获新请求
- ✅ 清空按钮 - 快速清空请求列表

### 技术实现

#### 请求拦截（injected.js）
```javascript
// 去重机制
const DEDUP_WINDOW = 500; // 500ms窗口
function getRequestFingerprint(url, method, body, status) {
    return `${method}:${url}:${bodyHash}:${status}`;
}

// 自动JSON解析
let parsedBody = responseText;
try {
    parsedBody = JSON.parse(responseText);
} catch (e) {
    // 保持原样
}
```

#### 双重去重（panel.js）
```javascript
// 前端去重
const isDuplicate = this.requests.some(r => 
    r.url === request.url && 
    r.method === request.method && 
    Math.abs(r.timestamp - request.timestamp) < 500
);

// 只添加完整请求
if (!request.response || !request.duration) {
    return;
}
```

#### 视图模式感知复制
```javascript
const isRawMode = container && 
    container.querySelector('.view-btn[data-mode="raw"].active');

if (isRawMode) {
    body = JSON.stringify(request.body); // 紧凑
} else {
    body = JSON.stringify(request.body, null, 2); // 格式化
}
```

### 已知问题修复

#### 问题1: 重复请求捕获
**原因**: 
- fetch和XMLHttpRequest都会触发捕获
- 没有有效的去重机制

**解决方案**:
- 实现双重去重（前端+后端）
- 使用请求指纹（URL+方法+请求体+状态码）
- 500ms去重窗口

#### 问题2: 名称显示完整URL
**原因**: 
- parseUrl方法返回完整路径
- 没有提取最后一个路径段

**解决方案**:
- 提取pathname的最后一个字段
- 增强错误处理
- 确保name不为空

#### 问题3: 复制格式不正确
**原因**: 
- 没有根据视图模式调整输出格式
- 统一使用格式化输出

**解决方案**:
- 检测当前视图模式
- 格式化模式：`JSON.stringify(data, null, 2)`
- 原始模式：`JSON.stringify(data)`

#### 问题4: 请求头显示[object Object]
**原因**: 
- headers可能是数组或对象
- 直接toString导致显示错误

**解决方案**:
- 标准化headers格式
- 确保value转换为字符串
- 使用normalizeHeaders方法

#### 问题5: 认证信息不显示和重置
**原因**: 
- authContent元素在认证tab初始化前不存在
- 每次切换到认证tab都会调用initializeAuthTab
- initializeAuthTab会重置认证类型为"无认证"

**解决方案**:
- 使用_pendingAuthHeaders保存待处理的认证信息
- 使用_authTabInitialized标志防止重复初始化
- 只在第一次切换到认证tab时初始化和填充
- 在editRequest和newRequest时重置标志
- 添加详细的调试日志

### 性能优化

- ✅ 请求数量限制 - 最多保存1000个请求
- ✅ 缓存清理 - 自动清理过期的去重缓存
- ✅ 懒加载 - 按需渲染请求详情
- ✅ 事件委托 - 减少事件监听器数量

### 文档整理

- ✅ 删除重复的修复说明文档
- ✅ 更新README.md
- ✅ 创建CHANGELOG.md
- ✅ 保留核心文档：README、INSTALL、TEST_GUIDE、NETWORK_IMPORT_GUIDE

### 下一步计划

1. **批量操作** - 支持批量重放、导出
2. **环境变量** - 支持变量替换
3. **请求分组** - 按项目或模块分组
4. **性能分析** - 接口耗时统计和分析
5. **WebSocket** - 支持WebSocket调试
6. **GraphQL** - 支持GraphQL查询调试

---

**版本**: v1.0.0  
**更新日期**: 2024年
