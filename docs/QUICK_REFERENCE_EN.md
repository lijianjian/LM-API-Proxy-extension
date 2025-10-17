# Quick Reference Guide - VS Code LM API Proxy

**Languages**: [English](./QUICK_REFERENCE_EN.md) | [中文](./QUICK_REFERENCE.md)

## 🚀 Get Started in 5 Minutes

### 1. Start the Extension

```
1. Open VS Code
2. Press F5 (dev mode) or install from Marketplace
3. Ctrl+Shift+P → "LM Proxy: Start Server"
4. See "✓ LM Proxy:3000" in status bar
```

### 2. Test Connection

```bash
curl http://127.0.0.1:3000/health
```

### 3. Send Your First Request

```python
import requests

response = requests.post(
    "http://127.0.0.1:3000/v1/chat/completions",
    json={
        "messages": [{"role": "user", "content": "Hello!"}]
    }
)

print(response.json()["choices"][0]["message"]["content"])
```

## 📋 Common Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `LM Proxy: Start Server` | - | Start the server |
| `LM Proxy: Stop Server` | - | Stop the server |
| `LM Proxy: Select Model` | - | Select a model |
| `LM Proxy: Set Log Level` | - | Set log level |
| `LM Proxy: Show Output Panel` | - | View logs |

## 🔧 Configuration Reference

```json
{
  // Basic settings
  "lmApiProxy.port": 3000,
  "lmApiProxy.autoStart": false,
  "lmApiProxy.allowCors": true,
  
  // Log settings
  "lmApiProxy.logLevel": 1,  // 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
  "lmApiProxy.showOutputOnStartup": false
}
```

## 📡 API Quick Reference

### Health Check

```bash
GET /health
→ {"status": "ok", "timestamp": "...", "version": "0.0.3"}
```

### List Models

```bash
GET /v1/models
→ {"object": "list", "data": [{...}]}
```

### Chat Completion

```bash
POST /v1/chat/completions
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "..."}],
  "max_tokens": 100,
  "stream": false
}
```

### Streaming Chat

```bash
POST /v1/chat/completions
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "..."}],
  "stream": true
}

→ data: {"choices":[{"delta":{"content":"..."}}]}
→ data: [DONE]
```

## 💡 Common Issues

### Q: Server won't start?

**A**: Check if:
1. Port 3000 is not in use: `netstat -ano | findstr :3000`
2. VS Code has GitHub Copilot installed and active
3. Check Output panel: `LM Proxy: Show Output Panel`

### Q: No models available?

**A**: Ensure:
1. GitHub Copilot subscription is active
2. Signed in to GitHub in VS Code
3. Run `LM Proxy: Select Model` to refresh

### Q: Rate limit errors?

**A**: This is from GitHub Copilot's backend:
1. Wait a few minutes and retry
2. Reduce request frequency
3. Check your Copilot subscription status

## 🎯 Example Scripts

### Python Client

```python
import requests

def chat(message: str, stream: bool = False):
    url = "http://127.0.0.1:3000/v1/chat/completions"
    payload = {
        "messages": [{"role": "user", "content": message}],
        "stream": stream
    }
    
    if stream:
        response = requests.post(url, json=payload, stream=True)
        for line in response.iter_lines():
            if line:
                print(line.decode('utf-8'))
    else:
        response = requests.post(url, json=payload)
        return response.json()["choices"][0]["message"]["content"]

# Usage
print(chat("Hello, world!"))
```

### PowerShell Test

```powershell
# Test OpenAI API
$body = @{
    messages = @(
        @{role = "user"; content = "Hello!"}
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:3000/v1/chat/completions" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Anthropic API

```python
import requests

response = requests.post(
    "http://127.0.0.1:3000/v1/messages",
    headers={"anthropic-version": "2023-06-01"},
    json={
        "model": "claude-3-5-sonnet-20241022",
        "messages": [{"role": "user", "content": "Hello!"}],
        "max_tokens": 1024
    }
)

print(response.json()["content"][0]["text"])
```

## 🔗 More Resources

- [Full Documentation](./README.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_EN.md)
- [Test Commands](./TEST_COMMANDS_EN.md)
- [API Documentation](./ANTHROPIC_API_EN.md)

---

**Need more help?** Check the [FAQ](./TROUBLESHOOTING_EN.md) or [open an issue](https://github.com/lijianjian/vs-code-lm-api-proxy/issues).
