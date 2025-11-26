# RestFlow Network面板导入指南

## 🚀 如何从Chrome DevTools Network面板导入请求

由于Chrome扩展的安全限制，RestFlow无法直接在Network面板添加右键菜单。但您可以通过以下简单步骤导入网络请求：

### 方法一：cURL导入（推荐）

1. **打开Chrome DevTools** (F12)
2. **切换到Network标签页**
3. **找到要导入的请求**，右键点击
4. **选择 "Copy" → "Copy as cURL"**
5. **切换到RestFlow面板**
6. **点击"导入cURL"按钮**
7. **粘贴cURL命令**，点击导入

### 方法二：手动创建

1. **在RestFlow中点击"新建请求"**
2. **从Network面板复制以下信息：**
   - 请求方法 (GET/POST/PUT等)
   - 请求URL
   - 请求头 (Headers标签页)
   - 请求体 (如果是POST请求，在Payload标签页)
3. **在RestFlow中填入对应信息**

### 方法三：自动捕获

RestFlow会自动捕获页面中的API请求，包括：
- 包含 `/api/`、`/v1/`、`/v2/` 的URL
- 返回JSON格式的请求
- 非GET方法的请求

## 💡 使用技巧

### cURL格式示例
```bash
curl -X POST 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer token123' \
  -d '{"name":"张三","email":"zhangsan@example.com"}'
```

### 支持的cURL参数
- `-X` 或 `--request`: HTTP方法
- `-H` 或 `--header`: 请求头
- `-d` 或 `--data`: 请求体数据
- `--data-raw`: 原始数据

## 🔧 故障排除

### 问题：cURL导入失败
**解决方案：**
- 确保cURL命令完整
- 检查引号是否匹配
- 移除不必要的换行符

### 问题：自动捕获不工作
**解决方案：**
- 刷新页面重新触发请求
- 检查请求是否符合捕获条件
- 在RestFlow面板点击"刷新"按钮

### 问题：请求头显示不正确
**解决方案：**
- 使用cURL导入方式
- 手动复制粘贴请求头
- 检查JSON格式是否正确

## 📚 更多功能

- **请求重放**: 点击"重新发送"按钮
- **请求编辑**: 点击"编辑"按钮修改请求
- **请求复制**: 点击"复制"按钮创建副本
- **批量导出**: 导出所有请求为JSON文件
- **数据导入**: 导入之前导出的JSON文件

---

**提示**: RestFlow的自动捕获功能已经能够满足大部分使用场景，结合cURL导入功能，可以轻松处理各种API调试需求。
