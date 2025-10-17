# 增强日志功能使用指南

## 📋 新增功能

版本 0.0.3+ 添加了增强的日志功能，帮助更好地诊断问题。

### ✨ 新增的日志方法

1. **`logRequest()`** - 记录完整的HTTP请求
2. **`logResponse()`** - 记录HTTP响应
3. **`logApiError()`** - 记录详细的API错误（包含请求体和完整上下文）

## 🔧 如何启用详细日志

### 方法 1: 使用命令面板

```
1. 打开命令面板: Ctrl+Shift+P (Windows/Linux) 或 Cmd+Shift+P (Mac)
2. 运行: LM Proxy: Set Log Level
3. 选择: DEBUG (0)
```

### 方法 2: 修改设置

打开 VS Code 设置 (Ctrl+,)，添加或修改：

```json
{
  "lmApiProxy.logLevel": 0,
  "lmApiProxy.showOutputOnStartup": true
}
```

### 日志级别说明

| 级别 | 值 | 内容 |
|------|---|------|
| **DEBUG** | 0 | 🔍 **最详细** - 包含完整请求体、响应、VS Code API调用详情 |
| **INFO** | 1 | ℹ️ 基本信息 - 请求开始/结束、模型选择 |
| **WARN** | 2 | ⚠️ 警告 - 配置问题、非致命错误 |
| **ERROR** | 3 | ❌ 仅错误 - 致命错误和异常 |

## 📝 DEBUG 日志包含的信息

### 1. 请求日志

```
[2025-10-17T10:00:00.000Z] [DEBUG] Request:
{
  "method": "POST",
  "path": "/v1/chat/completions",
  "body": {
    "model": "gpt-4.1",
    "messages": [
      {"role": "user", "content": "Hello"}
    ],
    "max_tokens": 100,
    "stream": false
  },
  "headers": {
    "content-type": "application/json",
    "user-agent": "curl/7.68.0"
  }
}
```

### 2. VS Code API 调用日志

```
[2025-10-17T10:00:01.000Z] [DEBUG] Sending non-streaming request to VS Code LM API, model: gpt-4.1
[2025-10-17T10:00:01.001Z] [DEBUG] VS Code request messages
{
  "messageCount": 1,
  "options": {
    "justification": "User chat request"
  }
}
```

### 3. 详细错误日志

```
[2025-10-17T10:00:01.500Z] [ERROR] API Error in non-streaming request
  Model: gpt-4.1
  Request Body: {
    "model": "gpt-4.1",
    "messages": [
      {"role": "user", "content": "Hello"}
    ],
    "max_tokens": 100
  }
  Error: Unexpected chat message content type llm 2
  Stack: Error: Unexpected chat message content type llm 2
    at file:///c:/Users/.../extensionHostProcess.js:111:29955
    at Array.map (<anonymous>)
    ...
  Additional Info: {
    "requestId": "msg_1760671386795_xxx",
    "messageCount": 1,
    "options": {
      "justification": "User chat request"
    }
  }
```

## 🔍 诊断 "Unexpected content type" 错误

### 启用DEBUG日志后，你会看到：

1. **完整的请求信息**
   - 使用的模型名称
   - 发送的消息内容
   - 所有参数（max_tokens, temperature等）

2. **VS Code LM API 转换后的请求**
   - VS Code 内部使用的消息格式
   - 转换后的options

3. **详细的错误信息**
   - 错误发生的位置
   - 完整的堆栈跟踪
   - 请求的上下文信息

### 示例：诊断模型兼容性问题

**问题**: 使用 `gpt-4.1` 模型时报错

**DEBUG日志显示**:

```
[DEBUG] Request:
  model: "gpt-4.1"
  messages: [{"role":"user","content":"test"}]

[DEBUG] Sending non-streaming request to VS Code LM API, model: gpt-4.1

[ERROR] API Error in non-streaming request
  Model: gpt-4.1
  Error: Unexpected chat message content type llm 2
  Stack: ... (VS Code internal error)
```

**结论**: 
- 模型 `gpt-4.1` 被找到了（没有 "model not found" 错误）
- 但 VS Code LM API 返回了不支持的内容类型
- **解决方案**: 尝试使用 `gpt-4o` 或其他模型

## 📊 日志输出示例

### 成功的请求

```
[INFO] Chat completion request started: msg_xxx
[DEBUG] Request:
  method: POST
  path: /v1/chat/completions
  body: {...}
[DEBUG] Request body {...}
[INFO] Using model: gpt-4o
[DEBUG] Converted 1 messages
[INFO] Handling non-streaming request
[DEBUG] Sending non-streaming request to VS Code LM API, model: gpt-4o
[DEBUG] VS Code request messages {messageCount: 1, options: {...}}
[DEBUG] Sending response to client {contentLength: 45}
[INFO] Chat completion request completed: msg_xxx
```

### 失败的请求

```
[INFO] Chat completion request started: msg_xxx
[DEBUG] Request:
  method: POST
  path: /v1/chat/completions
  body: {"model":"gpt-4.1",...}
[DEBUG] Request body {...}
[INFO] Using model: gpt-4.1
[DEBUG] Converted 1 messages
[INFO] Handling non-streaming request
[DEBUG] Sending non-streaming request to VS Code LM API, model: gpt-4.1
[DEBUG] VS Code request messages {messageCount: 1, options: {...}}
[ERROR] API Error in non-streaming request
  Model: gpt-4.1
  Request Body: {"model":"gpt-4.1","messages":[...]}
  Error: Unexpected chat message content type llm 2
  Stack: Error: Unexpected chat message content type llm 2
    at file:///.../extensionHostProcess.js:111:29955
    ...
  Additional Info: {
    "requestId": "msg_xxx",
    "messageCount": 1,
    "options": {"justification":"User chat request"}
  }
```

## 🛠️ 数据隐私保护

日志系统自动保护敏感信息：

### 自动隐藏的字段

- 任何包含 `token` 的字段 → `***REDACTED***`
- 任何包含 `key` 的字段 → `***REDACTED***`
- 任何包含 `secret` 的字段 → `***REDACTED***`
- 任何包含 `auth` 的header → `***REDACTED***`

### 自动截断

- 长字符串（>1000字符）会被截断
- 显示格式: `"Hello world... (500 more chars)"`

## 💡 最佳实践

### 1. 开发/调试时

```json
{
  "lmApiProxy.logLevel": 0,  // DEBUG
  "lmApiProxy.showOutputOnStartup": true
}
```

### 2. 生产环境

```json
{
  "lmApiProxy.logLevel": 2,  // WARN
  "lmApiProxy.showOutputOnStartup": false
}
```

### 3. 排查问题时

1. 设置日志级别为 DEBUG
2. 重现问题
3. 从 Output Panel 复制完整日志
4. 在 GitHub Issue 中提供日志

### 4. 性能考虑

- DEBUG 级别会记录大量信息，可能影响性能
- 建议只在需要时启用
- 生产环境使用 INFO 或 WARN 级别

## 📤 报告问题时

当遇到错误时，请提供以下信息：

### 必需信息

1. **VS Code 版本**
   ```bash
   code --version
   ```

2. **完整的 DEBUG 日志**
   - 启用 DEBUG 级别
   - 重现错误
   - 复制完整日志从 Output Panel

3. **curl 命令或代码示例**
   ```bash
   curl -v http://10.14.0.187:3000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4.1","messages":[...]}'
   ```

### 日志示例（报告时提供）

```
===== 开始日志 =====
[2025-10-17T10:00:00.000Z] [INFO] Chat completion request started: msg_xxx
[2025-10-17T10:00:00.001Z] [DEBUG] Request:
{
  "method": "POST",
  "path": "/v1/chat/completions",
  "body": {
    "model": "gpt-4.1",
    "messages": [{"role":"user","content":"test"}]
  }
}
[2025-10-17T10:00:00.500Z] [ERROR] API Error in non-streaming request
  Model: gpt-4.1
  Request Body: {"model":"gpt-4.1",...}
  Error: Unexpected chat message content type llm 2
  Stack: ...
===== 结束日志 =====

VS Code 版本: 1.105.0
操作系统: Windows 11
扩展版本: 0.0.3
```

## 🔗 相关文档

- [故障排除指南](./TROUBLESHOOTING.md)
- [错误修复文档](./ERROR_FIX_CONTENT_TYPE.md)
- [快速参考](./QUICK_REFERENCE.md)

---

**更新日期**: 2025-10-17  
**版本**: 0.0.3+
