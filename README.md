# RestFlow - 优雅的API调试工具

一款轻量级、高颜值的Chrome浏览器插件，专为前端开发者打造。支持API请求捕获、编辑重放、cURL导入等强大功能，让API调试变得优雅高效。

![](/images/01.png)

![](/images/02.png)

![](/images/03.png)

![](/images/04.png)

## 🚀 功能特性

### 核心功能
- **自动捕获API请求** - 自动拦截页面中的HTTP/HTTPS请求
- **DevTools集成** - 在F12开发者工具中添加专用调试面板
- **一键重放请求** - 支持修改参数后重新发送请求
- **请求详情查看** - 完整显示请求/响应的头部、参数、响应数据
- **右键菜单支持** - 在Network面板中右键快速捕获请求

### 高级功能
- **🎨 现代化UI** - 精美的界面设计，支持深色模式
- **📝 多种编辑模式** - Raw/表单双模式，支持JSON格式化
- **📋 cURL导入** - 一键导入从浏览器/Postman复制的cURL命令
- **🔄 智能重放** - 自动创建重放记录，支持参数修改
- **🔍 高级过滤** - 多维度过滤：方法、状态、类型等
- **💾 数据管理** - 完整的导入导出，支持请求历史管理
- **⚡ 性能优化** - 轻量级设计，不影响页面性能

## 📦 安装方法

### 开发模式安装
1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹
6. 插件安装完成

### 使用方法
1. 安装插件后，浏览任意网页
2. 按F12打开开发者工具
3. 点击"RestFlow"标签页
4. 页面中的API请求会自动显示在列表中
5. 点击任意请求查看详情，支持重放和编辑
6. 使用"新建"按钮创建自定义请求
7. 通过"cURL"按钮导入外部请求

## 🛠️ 项目结构

```
restflow-extension/
├── manifest.json          # 插件配置文件
├── devtools.html          # DevTools页面入口
├── devtools.js            # DevTools逻辑
├── panel.html             # 主面板HTML (现代化UI)
├── popup.html             # 弹出窗口HTML
├── background.js          # 后台服务脚本
├── content.js             # 内容脚本
├── injected.js            # 页面注入脚本
├── styles/
│   ├── panel.css          # 核心样式
│   └── components.css     # 组件样式
├── scripts/
│   ├── panel.js           # 面板核心逻辑
│   ├── features.js        # 新功能扩展
│   └── popup.js           # 弹出窗口逻辑
├── icons/
│   ├── icon.svg           # 矢量图标
│   └── create_icons.html  # 图标生成工具
├── generate_icons.js      # 图标生成脚本
├── README.md              # 项目说明
└── INSTALL.md             # 安装指南
```

## 🔧 技术架构

### 组件通信
```
页面请求 → injected.js → content.js → background.js → devtools panel
```

### 核心技术
- **Manifest V3** - 最新的Chrome扩展API
- **DevTools API** - 深度集成开发者工具
- **Network Interception** - 网络请求拦截技术
- **Chrome Storage API** - 本地数据存储
- **Message Passing** - 组件间通信机制

## 📋 开发计划

### 已完成功能 ✅
- [x] 基础项目架构搭建
- [x] DevTools面板集成
- [x] 网络请求拦截
- [x] 请求列表显示
- [x] 请求详情查看
- [x] 基础UI界面

### 已完成高级功能 ✅
- [x] 请求重放功能 - 支持一键重放，自动创建新请求记录
- [x] 请求编辑功能 - 支持修改方法、URL、头部、请求体
- [x] 数据导入导出 - JSON格式，包含完整元数据
- [x] 搜索和过滤优化 - 多维度过滤：方法、状态、类型
- [x] 代码生成器 - 支持cURL、Fetch、PowerShell等多种格式
- [x] 查询参数展示 - GET请求参数独立展示
- [x] URL解码显示 - 自动解码中文参数
- [x] 请求去重 - 智能过滤重复请求
- [x] 认证支持 - Bearer Token、Basic Auth等
- [x] JSON格式化/压缩 - 一键格式化和压缩JSON
- [x] 视图切换 - 格式化/原始双视图模式
- [x] 复制优化 - 根据视图模式智能复制

### 计划功能 📅
- [ ] 批量操作支持
- [ ] 环境变量管理
- [ ] 请求分组功能
- [ ] 性能分析工具
- [ ] 自动化测试集成
- [ ] WebSocket支持
- [ ] GraphQL支持

## 🎯 使用场景

### 前端开发调试
- 快速查看API请求和响应
- 调试接口参数和返回数据
- 重现和分析接口错误

### 接口测试
- 修改请求参数进行测试
- 批量执行接口测试
- 导出测试数据到其他工具

### 性能优化
- 分析接口响应时间
- 监控API调用频率
- 识别性能瓶颈

## 🔍 核心文件说明

### manifest.json
插件的配置文件，定义了权限、入口点和基本信息。

### background.js
后台服务脚本，处理：
- 请求数据存储和管理
- 组件间消息转发
- 请求重放逻辑
- 数据导入导出

### devtools.js & panel.html
DevTools集成相关文件：
- 创建自定义面板
- 监听网络请求
- 提供调试界面

### injected.js & content.js
请求拦截相关文件：
- 拦截fetch和XMLHttpRequest
- 解析请求和响应数据
- 与后台脚本通信

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 开发环境设置
1. 克隆项目：`git clone [项目地址]`
2. 在Chrome中加载插件进行测试
3. 修改代码后重新加载插件

### 提交规范
- 使用清晰的commit信息
- 确保代码符合项目风格
- 添加必要的注释和文档

## 📄 许可证

MIT License - 详见LICENSE文件

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件到：[994019222@qq.com]

---

**注意**: 这是一个开发中的项目，部分功能可能还不完善。欢迎反馈和建议！
