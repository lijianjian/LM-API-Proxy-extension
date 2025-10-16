# VS Code Language Model API Proxy

[English](#english) | [中文](#中文)

---

## 中文

这是一个 VS Code 扩展，它将 VS Code Language Model API（GitHub Copilot 的后端模型）包装成一个本地 HTTP 代理服务，供同一台机器或局域网内的其他程序调用。

### ✨ 功能特性

- 🚀 **OpenAI 兼容 API** - 将 VS Code LM API 封装为标准的 OpenAI Chat Completions API 格式
- 🤖 **多模型支持** - 支持 gpt-4o、gpt-4o-mini、claude-3.5-sonnet 等多种模型  
- 🔄 **流式响应** - 完整支持 Server-Sent Events (SSE) 流式传输
- 🎯 **智能模型管理** - 可选择特定模型或使用默认模型，支持模型持久化
- 📊 **高级日志系统** - 支持 DEBUG/INFO/WARN/ERROR 四级日志，便于调试
- 🛡️ **CORS 支持** - 内置跨域请求支持
- 🌐 **网络访问** - 服务器绑定到所有网络接口，支持局域网访问
- ⚙️ **灵活配置** - 可配置端口、自动启动、日志级别等选项

### 📋 系统要求

- VS Code 1.102.0 或更高版本
- GitHub Copilot 扩展已安装并激活
- 有效的 GitHub Copilot 订阅

### 🚀 快速开始

#### 1. 启动服务器

1. 按 `F5` 启动扩展开发模式
2. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
3. 运行 `LM Proxy: Start Server`
4. 服务器将在端口 3000 上启动

#### 2. 测试 API

```bash
# 健康检查
curl http://127.0.0.1:3000/health

# 获取可用模型
curl http://127.0.0.1:3000/v1/models

# 发送聊天请求
curl http://127.0.0.1:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
```

### 📋 可用命令

| 命令 | 描述 |
|------|------|
| `LM Proxy: Start Server` | 启动代理服务器 |
| `LM Proxy: Stop Server` | 停止代理服务器 |
| `LM Proxy: Show Status` | 显示服务器状态 |
| `LM Proxy: Select Model` | 选择要使用的语言模型 |
| `LM Proxy: Set Log Level` | 设置日志级别 |
| `LM Proxy: Show Output Panel` | 显示输出面板 |
| `LM Proxy: Clear Output Panel` | 清空输出面板 |

### 📡 API 文档

#### GET `/health`
健康检查端点

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-21T...",
  "version": "0.0.2"
}
```

#### GET `/v1/models`
获取可用模型列表

**响应:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "name": "GPT-4o",
      "vendor": "copilot",
      "family": "gpt-4o",
      "max_input_tokens": 128000
    }
  ]
}
```

#### POST `/v1/chat/completions`
创建聊天补全（OpenAI 兼容）

**请求体:**
```json
{
  "model": "gpt-4o",  // 可选，省略则使用默认模型
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 100,
  "temperature": 0.7,  // VS Code LM API 可能不支持
  "stream": false      // true 启用流式响应
}
```

**非流式响应:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1705881600,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

**流式响应 (SSE):**
```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1705881600,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1705881600,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1705881600,"model":"gpt-4o","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### 💻 使用示例

#### Python

```python
import requests
import json

# 简单聊天
response = requests.post(
    "http://127.0.0.1:3000/v1/chat/completions",
    json={
        "messages": [
            {"role": "user", "content": "What is Python?"}
        ],
        "max_tokens": 150
    }
)

result = response.json()
print(result["choices"][0]["message"]["content"])

# 流式聊天
response = requests.post(
    "http://127.0.0.1:3000/v1/chat/completions",
    json={
        "messages": [
            {"role": "user", "content": "Count to 5"}
        ],
        "stream": True
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        line_text = line.decode('utf-8')
        if line_text.startswith('data: '):
            data = line_text[6:]
            if data != '[DONE]':
                chunk = json.loads(data)
                content = chunk['choices'][0]['delta'].get('content', '')
                if content:
                    print(content, end='', flush=True)
```

#### JavaScript/TypeScript

```javascript
// 简单聊天
const response = await fetch('http://127.0.0.1:3000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is JavaScript?' }],
        max_tokens: 150
    })
});

const data = await response.json();
console.log(data.choices[0].message.content);

// 流式聊天
const streamResponse = await fetch('http://127.0.0.1:3000/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        messages: [{ role: 'user', content: 'Count to 5' }],
        stream: true
    })
});

const reader = streamResponse.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data !== '[DONE]') {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) process.stdout.write(content);
            }
        }
    }
}
```

### ⚙️ 配置选项

在 VS Code 设置中配置（`settings.json`）：

```json
{
  "lmApiProxy.port": 3000,
  "lmApiProxy.autoStart": false,
  "lmApiProxy.allowCors": true,
  "lmApiProxy.logLevel": 1,
  "lmApiProxy.showOutputOnStartup": false
}
```

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `port` | number | 3000 | HTTP 服务器端口 |
| `autoStart` | boolean | false | VS Code 启动时自动开启代理 |
| `allowCors` | boolean | true | 启用 CORS 支持 |
| `logLevel` | number | 1 | 日志级别: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR |
| `showOutputOnStartup` | boolean | false | 启动时显示输出面板 |

### 🧪 测试

运行综合测试：

```bash
python test_comprehensive.py
```

测试内容：
- ✅ 健康检查
- ✅ API 信息
- ✅ 模型列表
- ✅ 简单聊天
- ✅ 指定模型聊天
- ✅ 流式响应
- ✅ 多轮对话

### 🏗️ 项目结构

```
src/
├── extension.ts              # 扩展入口
├── converter/
│   └── openaiConverter.ts    # OpenAI 格式转换
├── model/
│   └── manager.ts            # 模型管理
├── server/
│   └── server.ts             # HTTP 服务器
└── utils/
    └── logger.ts             # 日志工具
```

### 🔒 安全提示

⚠️ **重要**: 此扩展将服务器绑定到 `0.0.0.0`，意味着：

- ✅ 可从局域网其他设备访问
- ⚠️ 请在受信任的网络中使用
- ⚠️ 建议配置防火墙规则
- ⚠️ 不要暴露到公网

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 📄 许可证

MIT License

### 🙏 致谢

本项目参考了以下优秀项目：
- [ryonakae/vscode-lm-proxy](https://github.com/ryonakae/vscode-lm-proxy)

---

## English

This VS Code extension wraps the VS Code Language Model API (GitHub Copilot's backend models) as a local HTTP proxy server, accessible by other programs on the same machine or local network.

### ✨ Features

- 🚀 **OpenAI-Compatible API** - Standard OpenAI Chat Completions API format
- 🤖 **Multiple Models** - Support for gpt-4o, claude-3.5-sonnet, etc.
- 🔄 **Streaming** - Full SSE streaming support
- 🎯 **Model Management** - Select models with persistence
- 📊 **Advanced Logging** - DEBUG/INFO/WARN/ERROR levels
- 🛡️ **CORS Support** - Built-in cross-origin support
- 🌐 **Network Access** - LAN accessible
- ⚙️ **Flexible Config** - Customizable settings

### 📋 Requirements

- VS Code 1.102.0+
- GitHub Copilot extension active
- Valid Copilot subscription

### 🚀 Quick Start

1. Press `F5` to start development
2. Run `LM Proxy: Start Server` in Command Palette
3. Test: `curl http://127.0.0.1:3000/health`

See Chinese section for detailed documentation.

### 📄 License

MIT License
