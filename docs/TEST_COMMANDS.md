# 测试命令参考

**语言**: [English](./TEST_COMMANDS_EN.md) | [中文](./TEST_COMMANDS.md)

## Anthropic API 测试

### 1. 基本非流式请求（PowerShell）
```powershell
$body = @{
    model = 'claude-3.5-sonnet'
    max_tokens = 1024
    messages = @(
        @{
            role = 'user'
            content = 'Say hello in French'
        }
    )
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri http://10.14.0.187:3000/v1/messages -Method Post -Body $body -ContentType 'application/json'
Write-Host "Answer: $($response.content[0].text)"
```

### 2. 带系统提示词
```powershell
$body = @{
    model = 'claude-3.5-sonnet'
    max_tokens = 1024
    system = 'You are a helpful pirate. Always speak like a pirate.'
    messages = @(
        @{
            role = 'user'
            content = 'Tell me about the weather'
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://10.14.0.187:3000/v1/messages -Method Post -Body $body -ContentType 'application/json'
```

### 3. 多轮对话
```powershell
$body = @{
    model = 'gpt-4o'
    max_tokens = 1024
    messages = @(
        @{
            role = 'user'
            content = 'My favorite animal is a cat'
        },
        @{
            role = 'assistant'
            content = 'Cats are wonderful pets!'
        },
        @{
            role = 'user'
            content = 'What is my favorite animal?'
        }
    )
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri http://10.14.0.187:3000/v1/messages -Method Post -Body $body -ContentType 'application/json'
Write-Host "Answer: $($response.content[0].text)"
```

### 4. 流式请求
```powershell
$body = @{
    model = 'claude-3.5-sonnet'
    max_tokens = 1024
    messages = @(
        @{
            role = 'user'
            content = 'Count from 1 to 5'
        }
    )
    stream = $true
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri http://10.14.0.187:3000/v1/messages -Method Post -Body $body -ContentType 'application/json' | Select-Object -ExpandProperty Content
```

### 5. 测试错误处理（缺少 max_tokens）
```powershell
$body = @{
    model = 'claude-3.5-sonnet'
    messages = @(
        @{
            role = 'user'
            content = 'Hello'
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri http://10.14.0.187:3000/v1/messages -Method Post -Body $body -ContentType 'application/json'
} catch {
    Write-Host "Error (expected): $($_.Exception.Message)"
}
```

## OpenAI API 测试

### 1. 基本请求
```powershell
$body = @{
    messages = @(
        @{
            role = 'user'
            content = 'Say hello in Chinese'
        }
    )
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri http://10.14.0.187:3000/v1/chat/completions -Method Post -Body $body -ContentType 'application/json'
Write-Host "Answer: $($response.choices[0].message.content)"
```

### 2. 指定模型
```powershell
$body = @{
    model = 'gpt-4o'
    messages = @(
        @{
            role = 'user'
            content = 'What is 2+2?'
        }
    )
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri http://10.14.0.187:3000/v1/chat/completions -Method Post -Body $body -ContentType 'application/json'
Write-Host "Model: $($response.model)"
Write-Host "Answer: $($response.choices[0].message.content)"
```

## Ubuntu/Linux 测试

### Anthropic API

```bash
# 基本请求
curl -X POST http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3.5-sonnet",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Say hello in French"
      }
    ]
  }' | jq .

# 带系统提示词
curl -X POST http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3.5-sonnet",
    "max_tokens": 1024,
    "system": "You are a helpful pirate. Always speak like a pirate.",
    "messages": [
      {
        "role": "user",
        "content": "Tell me about the weather"
      }
    ]
  }' | jq .

# 流式请求
curl -X POST http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "model": "claude-3.5-sonnet",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Write a haiku"
      }
    ],
    "stream": true
  }'
```

### OpenAI API

```bash
# 基本请求
curl -X POST http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }' | jq .

# 流式请求
curl -X POST http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Count to 5"
      }
    ],
    "stream": true
  }'
```

## 其他测试

### 健康检查
```bash
curl http://10.14.0.187:3000/health
```

### 模型列表
```bash
curl http://10.14.0.187:3000/v1/models | jq '.data[] | {id, name}'
```

### API 信息
```bash
curl http://10.14.0.187:3000/
```
