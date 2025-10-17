# Anthropic API Support Documentation

**Languages**: [English](./ANTHROPIC_API_EN.md) | [中文](./ANTHROPIC_API.md)

## Overview

This extension now supports the **Anthropic Messages API** format, fully compatible with the official Anthropic Claude API!

**API Endpoint:** `POST /v1/messages`

**Version:** v0.0.3+

## Quick Start

### Basic Request

```bash
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Hello, Claude!"
      }
    ]
  }'
```

### Python Example

```python
import requests

response = requests.post(
    "http://10.14.0.187:3000/v1/messages",
    headers={
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
    },
    json={
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "Hello, Claude!"}
        ]
    }
)

print(response.json())
```

### PowerShell Example

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "anthropic-version" = "2023-06-01"
}

$body = @{
    model = "claude-3-5-sonnet-20241022"
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
  -Headers $headers `
  -Body $body
```

## Request Format

### Required Fields

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}
```

### Optional Fields

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [...],
  "system": "You are a helpful assistant",
  "temperature": 1.0,
  "top_p": 0.7,
  "top_k": 5,
  "stream": false
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model name (e.g., `claude-3-5-sonnet-20241022`) |
| `max_tokens` | integer | Yes | Maximum tokens to generate |
| `messages` | array | Yes | Conversation messages |
| `system` | string | No | System prompt |
| `temperature` | number | No | Randomness (0.0-2.0) |
| `top_p` | number | No | Nucleus sampling (0.0-1.0) |
| `top_k` | integer | No | Top-k sampling |
| `stream` | boolean | No | Enable streaming (default: false) |

## Response Format

### Non-Streaming Response

```json
{
  "id": "msg_01ABC123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help you today?"
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 0,
    "output_tokens": 0
  }
}
```

### Streaming Response

Server-Sent Events (SSE) format:

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_01ABC","type":"message","role":"assistant"}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"!"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":2}}

event: message_stop
data: {"type":"message_stop"}
```

## Streaming Example

### Python with SSE

```python
import requests
import json

url = "http://10.14.0.187:3000/v1/messages"
headers = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01"
}
data = {
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Write a haiku"}],
    "stream": True
}

response = requests.post(url, headers=headers, json=data, stream=True)

for line in response.iter_lines():
    if line:
        line_text = line.decode('utf-8')
        if line_text.startswith('data: '):
            data_str = line_text[6:]  # Remove 'data: ' prefix
            if data_str.strip():
                event_data = json.loads(data_str)
                
                # Extract text deltas
                if event_data.get('type') == 'content_block_delta':
                    delta = event_data.get('delta', {})
                    if delta.get('type') == 'text_delta':
                        print(delta.get('text', ''), end='', flush=True)
```

### Node.js with SSE

```javascript
const fetch = require('node-fetch');

async function streamChat() {
  const response = await fetch('http://10.14.0.187:3000/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{role: 'user', content: 'Hello!'}],
      stream: true
    })
  });

  const reader = response.body;
  reader.on('data', chunk => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'content_block_delta') {
          process.stdout.write(data.delta.text);
        }
      }
    }
  });
}

streamChat();
```

## Available Models

All VS Code Language Models are accessible via Anthropic API format:

### Claude Models
- `claude-3-5-sonnet-20241022` (Sonnet 3.5 v2)
- `claude-3-5-sonnet-20240620` (Sonnet 3.5 v1)
- `claude-3-5-haiku-20241022` (Haiku 3.5)
- `claude-3-opus-20240229` (Opus 3)
- `claude-3-sonnet-20240229` (Sonnet 3)
- `claude-3-haiku-20240307` (Haiku 3)

### GPT Models (also work with Anthropic API!)
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4-turbo`
- `o1-preview`
- `o1-mini`

**Note:** When using GPT models with Anthropic API, they still work but behave as GPT models.

## Error Handling

### Error Response Format

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "max_tokens is required"
  }
}
```

### Common Error Types

| Error Type | Description | Solution |
|------------|-------------|----------|
| `invalid_request_error` | Invalid request format | Check request structure |
| `authentication_error` | Auth failed (shouldn't happen with this proxy) | Check setup |
| `rate_limit_error` | Too many requests | Wait and retry |
| `api_error` | Internal server error | Check logs |

### Example Error Handling

```python
import requests

try:
    response = requests.post(
        "http://10.14.0.187:3000/v1/messages",
        headers={"anthropic-version": "2023-06-01"},
        json={
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": "Hello"}]
        }
    )
    response.raise_for_status()
    data = response.json()
    
    if data.get('type') == 'error':
        print(f"API Error: {data['error']['message']}")
    else:
        print(data['content'][0]['text'])
        
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
```

## Comparison: Anthropic vs OpenAI API

| Feature | Anthropic API | OpenAI API |
|---------|---------------|------------|
| Endpoint | `/v1/messages` | `/v1/chat/completions` |
| Response field | `content[0].text` | `choices[0].message.content` |
| Max tokens | Required | Optional |
| System prompt | Separate `system` field | Message with `role: "system"` |
| Streaming format | SSE with events | SSE with `data:` only |

## Testing

See [test_anthropic.py](../tests/test_anthropic.py) for comprehensive test examples.

```bash
# Run Anthropic API tests
cd tests
python test_anthropic.py
```

## Additional Resources

- [Anthropic API Official Docs](https://docs.anthropic.com/claude/reference/messages_post)
- [Quick Reference Guide](./QUICK_REFERENCE_EN.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_EN.md)
- [Test Commands](./TEST_COMMANDS_EN.md)

---

**Questions?** [Open an issue](https://github.com/lijianjian/vs-code-lm-api-proxy/issues) on GitHub!
