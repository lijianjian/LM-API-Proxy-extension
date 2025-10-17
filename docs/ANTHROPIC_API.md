# Anthropic API 支持文档

**语言**: [English](./ANTHROPIC_API_EN.md) | [中文](./ANTHROPIC_API.md)

## 概述

本扩展现在支持 **Anthropic Messages API** 格式，与官方 Anthropic Claude API 完全兼容！

**API 端点:** `POST /v1/messages`

**版本:** v0.0.3+

## 快速开始

### 基本请求

```bash
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3.5-sonnet",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Hello, Claude!"
      }
    ]
  }'
```

### PowerShell 示例

```powershell
$body = @{
    model = "claude-3.5-sonnet"
    max_tokens = 1024
    messages = @(
        @{
            role = "user"
            content = "Hello, Claude!"
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://10.14.0.187:3000/v1/messages `
  -Method Post `
  -Body $body `
  -ContentType 'application/json'
```

## 请求格式

### 必需参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `model` | string | 模型ID（如 `claude-3.5-sonnet`, `gpt-4o` 等） |
| `max_tokens` | number | 生成的最大token数量（必须 > 0） |
| `messages` | array | 消息数组 |

### 消息格式

```json
{
  "role": "user" | "assistant",
  "content": "文本内容"
}
```

### 可选参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `system` | string | - | 系统提示词 |
| `temperature` | number | - | 温度参数（0-1） |
| `top_p` | number | - | Nucleus sampling |
| `top_k` | number | - | Top-K sampling |
| `stop_sequences` | array | - | 停止序列 |
| `stream` | boolean | false | 是否流式输出 |

## 响应格式

### 非流式响应

```json
{
  "id": "msg_1760581200_abc123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help you?"
    }
  ],
  "model": "claude-3.5-sonnet",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 0,
    "output_tokens": 0
  }
}
```

### 流式响应（SSE）

流式响应使用 Server-Sent Events (SSE) 格式，事件类型包括：

1. **message_start** - 消息开始
```
event: message_start
data: {"type":"message_start","message":{"id":"msg_xxx","type":"message","role":"assistant","model":"claude-3.5-sonnet"}}
```

2. **content_block_start** - 内容块开始
```
event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}
```

3. **content_block_delta** - 内容增量
```
event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}
```

4. **content_block_stop** - 内容块结束
```
event: content_block_stop
data: {"type":"content_block_stop","index":0}
```

5. **message_delta** - 消息元数据
```
event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":0}}
```

6. **message_stop** - 消息结束
```
event: message_stop
data: {"type":"message_stop"}
```

## 使用示例

### 1. 基本对话

```python
import requests

response = requests.post(
    "http://10.14.0.187:3000/v1/messages",
    json={
        "model": "claude-3.5-sonnet",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "What is 2+2?"}
        ]
    }
)

data = response.json()
print(data['content'][0]['text'])
```

### 2. 使用系统提示词

```python
response = requests.post(
    "http://10.14.0.187:3000/v1/messages",
    json={
        "model": "claude-3.5-sonnet",
        "max_tokens": 1024,
        "system": "You are a helpful pirate. Always speak like a pirate.",
        "messages": [
            {"role": "user", "content": "Tell me about the weather"}
        ]
    }
)
```

### 3. 多轮对话

```python
response = requests.post(
    "http://10.14.0.187:3000/v1/messages",
    json={
        "model": "gpt-4o",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "My name is Alice"},
            {"role": "assistant", "content": "Nice to meet you, Alice!"},
            {"role": "user", "content": "What's my name?"}
        ]
    }
)
```

### 4. 流式输出

```python
import requests

response = requests.post(
    "http://10.14.0.187:3000/v1/messages",
    json={
        "model": "claude-3.5-sonnet",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "Write a short poem"}
        ],
        "stream": True
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        line = line.decode('utf-8')
        if line.startswith('data:'):
            print(line)
```

### 5. 使用 JavaScript/TypeScript

```typescript
const response = await fetch('http://10.14.0.187:3000/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-3.5-sonnet',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});

const data = await response.json();
console.log(data.content[0].text);
```

## 可用模型

所有通过 VS Code Language Model API 可用的模型都可以使用，包括：

- `claude-3.5-sonnet` - Claude 3.5 Sonnet
- `claude-3.7-sonnet` - Claude 3.7 Sonnet
- `claude-sonnet-4` - Claude Sonnet 4
- `claude-sonnet-4.5` - Claude Sonnet 4.5
- `gpt-4o` - GPT-4o
- `gpt-4o-mini` - GPT-4o Mini
- `gpt-5` - GPT-5
- `gemini-2.5-pro` - Gemini 2.5 Pro
- 以及其他所有支持的模型...

查看所有可用模型：
```bash
curl http://10.14.0.187:3000/v1/models
```

## 与 OpenAI API 的对比

| 特性 | OpenAI API | Anthropic API |
|------|-----------|---------------|
| 端点 | `/v1/chat/completions` | `/v1/messages` |
| max_tokens | 可选 | **必需** |
| 系统消息 | messages 数组中 | 独立的 `system` 参数 |
| 响应格式 | `choices[].message.content` | `content[].text` |
| 流式事件 | OpenAI SSE 格式 | Anthropic SSE 格式 |

## 错误处理

### 错误响应格式

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "max_tokens is required and must be greater than 0"
  }
}
```

### 常见错误

| HTTP 状态码 | 错误类型 | 说明 |
|------------|---------|------|
| 400 | `invalid_request_error` | 请求参数无效 |
| 403 | `permission_error` | 没有访问权限 |
| 404 | `not_found_error` | 模型不存在 |
| 500 | `api_error` | 服务器内部错误 |

### 示例：缺少 max_tokens

```bash
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "Hi"}]
  }'
```

响应：
```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "max_tokens is required and must be greater than 0"
  }
}
```

## 测试

运行 Anthropic API 测试套件：

```bash
python test_anthropic.py
```

测试包括：
- ✅ 非流式请求
- ✅ 流式请求
- ✅ 系统消息
- ✅ 多轮对话
- ✅ 错误处理

## 兼容性说明

1. **VS Code API 限制**: 某些 Anthropic 参数（如 `temperature`, `top_p`, `top_k`）会被记录但可能不会完全生效，因为 VS Code Language Model API 不完全支持这些参数。

2. **Token 计数**: 响应中的 `usage.input_tokens` 和 `usage.output_tokens` 目前返回 0，因为 VS Code API 不提供 token 计数功能。

3. **模型名称**: 虽然 API 接受 Anthropic 模型名称（如 `claude-3.5-sonnet`），但实际使用的是 VS Code 中配置的对应模型。

## 更多信息

- [Anthropic API 官方文档](https://docs.anthropic.com/claude/reference/messages_post)
- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
- [项目 README](./README.md)
