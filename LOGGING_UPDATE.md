# 日志增强更新总结

## ✅ 已完成的改进

### 🎯 主要目标

解决用户反馈的问题：
- ❌ **旧问题**: 错误日志不够详细，难以定位问题
- ✅ **新功能**: 添加详细的请求体和错误上下文日志

### 📋 新增功能

#### 1. **增强的 Logger 类** (src/utils/logger.ts)

新增了3个专用日志方法：

```typescript
// 记录HTTP请求详情
logger.logRequest(method, path, body, headers);

// 记录HTTP响应详情  
logger.logResponse(statusCode, body);

// 记录API错误（包含完整上下文）
logger.logApiError({
    operation: 'chat.completions',
    model: 'gpt-4.1',
    requestBody: {...},
    error: error,
    additionalInfo: {...}
});
```

#### 2. **自动数据保护**

- 自动隐藏敏感字段 (token, key, secret, auth)
- 自动截断长字符串 (>1000字符)
- 保护用户隐私

#### 3. **请求追踪** (src/server/server.ts)

每个请求现在记录：
- 完整的请求体
- HTTP headers
- VS Code API 调用参数
- 详细的错误堆栈

## 📊 日志级别对比

### DEBUG (0) - 新增内容

**之前**:
```
[ERROR] Anthropic messages request failed: msg_xxx
  Error: Unexpected chat message content type llm 2
```

**现在**:
```
[DEBUG] Request:
{
  "method": "POST",
  "path": "/v1/chat/completions",
  "body": {
    "model": "gpt-4.1",
    "messages": [{"role":"user","content":"Hello"}],
    "max_tokens": 100
  },
  "headers": {...}
}

[DEBUG] Sending non-streaming request to VS Code LM API, model: gpt-4.1
[DEBUG] VS Code request messages
{
  "messageCount": 1,
  "options": {"justification":"User chat request"}
}

[ERROR] API Error in non-streaming request
  Model: gpt-4.1
  Request Body: {
    "model": "gpt-4.1",
    "messages": [{"role":"user","content":"Hello"}],
    "max_tokens": 100
  }
  Error: Unexpected chat message content type llm 2
  Stack: Error: Unexpected chat message content type llm 2
    at file:///c:/Users/.../extensionHostProcess.js:111:29955
    at Array.map (<anonymous>)
    at Object.i [as from] (file:///.../extensionHostProcess.js:111:29174)
    ...
  Additional Info: {
    "requestId": "msg_1760671386795_xxx",
    "messageCount": 1,
    "options": {"justification":"User chat request"}
  }
```

## 🔧 使用方法

### 启用详细日志

**方法 1: 命令面板**
```
Ctrl+Shift+P → LM Proxy: Set Log Level → DEBUG (0)
```

**方法 2: 设置文件**
```json
{
  "lmApiProxy.logLevel": 0
}
```

### 查看日志

```
Ctrl+Shift+P → LM Proxy: Show Output Panel
```

## 🎯 针对你的错误

### 错误信息
```json
{"type":"error","error":{"type":"api_error","message":"Model gpt-4.1 returned unsupported response format. Try a different model or update VS Code."}}
```

### 现在会记录的信息

1. **请求详情**:
   - 模型: `gpt-4.1`
   - 完整的请求体
   - 所有参数

2. **VS Code API 调用**:
   - 转换后的消息
   - 传递给 VS Code 的 options

3. **错误上下文**:
   - 完整的错误堆栈
   - 请求 ID
   - 时间戳
   - 消息数量

### 诊断步骤

1. **启用 DEBUG 日志**:
   ```
   命令面板 → LM Proxy: Set Log Level → DEBUG (0)
   ```

2. **重现错误**:
   ```bash
   curl http://10.14.0.187:3000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4.1","messages":[{"role":"user","content":"test"}]}'
   ```

3. **查看详细日志**:
   ```
   命令面板 → LM Proxy: Show Output Panel
   ```

4. **分析日志输出**:
   - 检查使用的模型名称
   - 查看 VS Code API 返回的错误
   - 确认请求参数是否正确

## 💡 关于 gpt-4.1 错误的分析

根据错误信息 `Model gpt-4.1 returned unsupported response format`：

### 可能的原因

1. **模型版本问题**
   - `gpt-4.1` 可能是新模型
   - VS Code LM API 可能还不支持其响应格式

2. **VS Code 版本**
   - 你使用的是 VS Code 1.105
   - 但某些模型可能需要更新的 VS Code 或特定的 API 版本

### 建议的解决方案

#### 方案 1: 使用经过验证的模型

```bash
# 尝试 gpt-4o
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"test"}]}'

# 或尝试 gpt-4o-mini
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

#### 方案 2: 检查可用模型

```bash
curl http://10.14.0.187:3000/v1/models | jq '.data[].id'
```

这会列出所有可用的模型，使用列表中的模型名称。

#### 方案 3: 查看详细日志

启用 DEBUG 日志后，你会看到：
- VS Code 内部的完整错误信息
- 模型是否真的存在
- VS Code API 具体返回了什么

## 📈 性能影响

### DEBUG 级别的日志量

- 每个请求: ~1-5 KB 日志
- 包含完整的请求体和响应
- 建议只在需要时启用

### 推荐配置

**开发/调试**:
```json
{"lmApiProxy.logLevel": 0}  // DEBUG
```

**生产环境**:
```json
{"lmApiProxy.logLevel": 1}  // INFO
```

**只看错误**:
```json
{"lmApiProxy.logLevel": 3}  // ERROR
```

## 🔗 相关文档

- [日志使用指南](./LOGGING_GUIDE.md) - 完整的日志功能文档
- [错误修复文档](./ERROR_FIX_CONTENT_TYPE.md) - "Unexpected content type" 错误详解
- [故障排除](./TROUBLESHOOTING.md) - 常见问题解决方案

## 📝 下一步

1. **重新编译并测试**:
   ```bash
   npm run compile
   # 按 F5 重启扩展
   ```

2. **启用 DEBUG 日志**:
   ```
   命令面板 → LM Proxy: Set Log Level → DEBUG (0)
   ```

3. **重现错误并查看日志**:
   ```
   命令面板 → LM Proxy: Show Output Panel
   ```

4. **尝试其他模型**:
   ```bash
   # 测试 gpt-4o
   curl http://10.14.0.187:3000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o","messages":[{"role":"user","content":"test"}]}'
   ```

---

**更新时间**: 2025-10-17  
**版本**: 0.0.3+  
**改进**: 增强日志系统，添加请求体和错误上下文记录
