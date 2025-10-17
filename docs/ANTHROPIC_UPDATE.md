# 🎉 Anthropic API 支持已添加！

## ✨ 新功能

### 新增 Anthropic Messages API 端点

**端点:** `POST /v1/messages`

现在你的 VS Code LM API Proxy 支持两种主流 AI API 格式：

1. **OpenAI Chat Completions API** - `/v1/chat/completions`
2. **Anthropic Messages API** - `/v1/messages` ✨ 新增

## 📦 更新内容

### 新增文件

1. **`src/converter/anthropicConverter.ts`** - Anthropic API 格式转换器
   - 支持 Anthropic Messages API 请求/响应格式
   - 支持流式和非流式输出
   - 完整的 SSE 事件类型支持
   - 错误处理和格式转换

2. **`test_anthropic.py`** - Anthropic API 测试套件
   - 5个完整的测试用例
   - 非流式、流式、系统消息、多轮对话、错误处理

3. **`ANTHROPIC_API.md`** - Anthropic API 使用文档
   - 详细的 API 文档
   - 请求/响应格式说明
   - 使用示例（Python, JavaScript, curl）
   - 与 OpenAI API 的对比

4. **`TEST_COMMANDS.md`** - 快速测试命令参考
   - PowerShell 测试命令
   - Bash 测试命令
   - 所有端点的快速测试

### 更新文件

1. **`src/server/server.ts`**
   - 添加 `/v1/messages` 路由
   - 添加 Anthropic 请求处理方法
   - 更新 API 信息（版本 v0.0.3）

2. **`package.json`**
   - 版本更新至 `0.0.3`
   - 描述更新：支持 OpenAI & Anthropic

## 🚀 快速开始

### 1. 重新加载扩展

按 `F5` 重新启动扩展开发模式，或在已运行的扩展窗口中执行：
- 命令面板: `Developer: Reload Window`

### 2. 启动服务器

```
LM Proxy: Start Server
```

### 3. 测试 Anthropic API

**PowerShell:**
```powershell
$body = @{
    model = 'claude-3.5-sonnet'
    max_tokens = 1024
    messages = @(
        @{
            role = 'user'
            content = 'Hello, Claude!'
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://10.14.0.187:3000/v1/messages `
  -Method Post `
  -Body $body `
  -ContentType 'application/json'
```

**Linux/Mac:**
```bash
curl -X POST http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3.5-sonnet",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'
```

### 4. 运行测试套件

```bash
python test_anthropic.py
```

## 📋 API 对比

| 特性 | OpenAI API | Anthropic API |
|------|-----------|---------------|
| **端点** | `/v1/chat/completions` | `/v1/messages` |
| **max_tokens** | 可选 | **必需** ⚠️ |
| **系统消息** | 在 messages 数组中 | 独立的 `system` 参数 |
| **响应路径** | `choices[0].message.content` | `content[0].text` |
| **流式格式** | OpenAI SSE | Anthropic SSE（6种事件类型） |
| **角色** | system/user/assistant | user/assistant（system 独立） |

## 🔍 Anthropic API 特点

### 必需参数

- `model` - 模型ID
- `max_tokens` - **必须提供且 > 0**
- `messages` - 消息数组

### 独特功能

1. **独立的系统提示词**
   ```json
   {
     "system": "You are a helpful assistant",
     "messages": [...]
   }
   ```

2. **SSE 事件类型**
   - `message_start` - 消息开始
   - `content_block_start` - 内容块开始
   - `content_block_delta` - 内容增量
   - `content_block_stop` - 内容块结束
   - `message_delta` - 消息元数据
   - `message_stop` - 消息结束

3. **结构化内容**
   ```json
   {
     "content": [
       {
         "type": "text",
         "text": "Hello!"
       }
     ]
   }
   ```

## 🧪 测试覆盖

### Anthropic API 测试

- ✅ 非流式请求
- ✅ 流式请求（SSE）
- ✅ 系统提示词
- ✅ 多轮对话
- ✅ 错误处理（缺少 max_tokens）

### OpenAI API 测试（已有）

- ✅ 健康检查
- ✅ 模型列表
- ✅ 简单聊天
- ✅ 指定模型
- ✅ 流式输出
- ✅ 多轮对话
- ✅ 温度参数

## 📚 文档

- **[ANTHROPIC_API.md](./ANTHROPIC_API.md)** - 完整的 Anthropic API 文档
- **[TEST_COMMANDS.md](./TEST_COMMANDS.md)** - 快速测试命令
- **[README.md](./README.md)** - 项目主文档
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 快速参考指南

## 🎯 下一步

1. **测试 Anthropic API**
   - 运行 `python test_anthropic.py`
   - 尝试 PowerShell 测试命令
   - 测试流式输出

2. **集成到你的应用**
   - 使用 `/v1/messages` 端点
   - 确保提供 `max_tokens` 参数
   - 处理 Anthropic 响应格式

3. **性能优化**（可选）
   - 调整日志级别
   - 监控请求性能
   - 根据需要调整端口和 CORS 设置

## ⚠️ 注意事项

1. **max_tokens 是必需的** - Anthropic API 要求必须提供此参数
2. **Token 计数为 0** - VS Code API 不提供 token 统计
3. **参数支持有限** - `temperature`, `top_p`, `top_k` 可能不完全生效

## 🎊 总结

你的 VS Code LM API Proxy 现在是一个**全功能的多格式 AI API 代理**！

- 支持 **OpenAI** 和 **Anthropic** 两种格式
- 完整的**流式和非流式**输出
- **20+ 模型**可用（GPT, Claude, Gemini 等）
- **局域网访问** - 从任何设备调用
- **完整测试** - 包含测试套件和文档

🎉 **享受使用吧！**
