# Test Commands Reference

**Languages**: [English](./TEST_COMMANDS_EN.md) | [中文](./TEST_COMMANDS.md)

## Quick Test Commands

### Health Check

```bash
# Simple health check
curl http://10.14.0.187:3000/health

# Expected output
# {"status":"ok","timestamp":"2025-01-15T10:30:00.000Z","version":"0.0.3"}
```

### List Available Models

```bash
# Get all available models
curl http://10.14.0.187:3000/v1/models

# Output format
# {
#   "object": "list",
#   "data": [
#     {"id": "gpt-4o", "object": "model", ...},
#     {"id": "claude-3-5-sonnet-20241022", "object": "model", ...}
#   ]
# }
```

## OpenAI API Tests

### Basic Chat Completion

```bash
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello in 5 words"}
    ],
    "max_tokens": 50
  }'
```

### With System Prompt

```bash
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant"},
      {"role": "user", "content": "Write a Python hello world"}
    ]
  }'
```

### Multi-turn Conversation

```bash
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is 2+2?"},
      {"role": "assistant", "content": "2+2 equals 4"},
      {"role": "user", "content": "What about 3+3?"}
    ]
  }'
```

### Streaming Response

```bash
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Count to 5"}],
    "stream": true
  }'
```

## Anthropic API Tests

### Basic Message

```bash
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello Claude!"}
    ]
  }'
```

### With System Prompt

```bash
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "system": "You are a poetry expert",
    "messages": [
      {"role": "user", "content": "Write a haiku"}
    ]
  }'
```

### Streaming Message

```bash
curl -N http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Count to 10"}],
    "stream": true
  }'
```

### Multi-turn with Anthropic

```bash
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "What is Python?"},
      {"role": "assistant", "content": "Python is a programming language."},
      {"role": "user", "content": "Show me a hello world example"}
    ]
  }'
```

## PowerShell Commands

### OpenAI API (PowerShell)

```powershell
# Basic request
$body = @{
    messages = @(
        @{role = "user"; content = "Hello!"}
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://10.14.0.187:3000/v1/chat/completions" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Anthropic API (PowerShell)

```powershell
# Basic request
$headers = @{
    "Content-Type" = "application/json"
    "anthropic-version" = "2023-06-01"
}

$body = @{
    model = "claude-3-5-sonnet-20241022"
    max_tokens = 1024
    messages = @(
        @{role = "user"; content = "Hello Claude!"}
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://10.14.0.187:3000/v1/messages" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

## Python Test Scripts

### OpenAI API (Python)

```python
import requests

def test_openai_api():
    url = "http://10.14.0.187:3000/v1/chat/completions"
    payload = {
        "messages": [
            {"role": "user", "content": "Say hello"}
        ]
    }
    
    response = requests.post(url, json=payload)
    print(response.json())

test_openai_api()
```

### Anthropic API (Python)

```python
import requests

def test_anthropic_api():
    url = "http://10.14.0.187:3000/v1/messages"
    headers = {"anthropic-version": "2023-06-01"}
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "Hello Claude!"}
        ]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    print(response.json())

test_anthropic_api()
```

### Streaming (Python)

```python
import requests
import json

def test_streaming():
    url = "http://10.14.0.187:3000/v1/chat/completions"
    payload = {
        "messages": [{"role": "user", "content": "Count to 5"}],
        "stream": True
    }
    
    response = requests.post(url, json=payload, stream=True)
    
    for line in response.iter_lines():
        if line:
            line_text = line.decode('utf-8')
            if line_text.startswith('data: '):
                data_str = line_text[6:]
                if data_str.strip() and data_str.strip() != '[DONE]':
                    data = json.loads(data_str)
                    content = data['choices'][0]['delta'].get('content', '')
                    if content:
                        print(content, end='', flush=True)

test_streaming()
```

## Using Test Suites

### Run OpenAI Tests

```bash
cd tests
python test_comprehensive.py
```

### Run Anthropic Tests

```bash
cd tests
python test_anthropic.py
```

### Run All Tests

```bash
cd tests
python test_comprehensive.py
python test_anthropic.py
```

## Debugging Commands

### Verbose Output

```bash
# OpenAI API with verbose output
curl -v http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

### Check Server Logs

```
1. Open VS Code
2. Ctrl+Shift+P → "LM Proxy: Show Output Panel"
3. View detailed logs
```

### Test Specific Model

```bash
# Test with specific model
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Error Testing

### Missing Required Field

```bash
# Anthropic: missing max_tokens (should error)
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

### Invalid Model

```bash
# Non-existent model
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "invalid-model-name",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

## Additional Resources

- [Quick Reference](./QUICK_REFERENCE_EN.md)
- [Anthropic API Documentation](./ANTHROPIC_API_EN.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_EN.md)
- [Test Suite README](../tests/README.md)

---

**Need more examples?** Check the [tests directory](../tests/) for comprehensive test scripts!
