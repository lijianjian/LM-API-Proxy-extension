# 快速参考指南 - VS Code LM API Proxy

## 🚀 5分钟上手

### 1. 启动扩展
```
1. 打开 VS Code
2. 按 F5（开发模式）或从 Marketplace 安装
3. Ctrl+Shift+P → "LM Proxy: Start Server"
4. 看到 "✓ LM Proxy:3000" 在状态栏
```

### 2. 测试连接
```bash
curl http://127.0.0.1:3000/health
```

### 3. 发送第一个请求
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

## 📋 常用命令

| 命令 | 快捷键 | 说明 |
|------|--------|------|
| `LM Proxy: Start Server` | - | 启动服务器 |
| `LM Proxy: Stop Server` | - | 停止服务器 |
| `LM Proxy: Select Model` | - | 选择模型 |
| `LM Proxy: Set Log Level` | - | 设置日志级别 |
| `LM Proxy: Show Output Panel` | - | 查看日志 |

## 🔧 配置速查

```json
{
  // 基础配置
  "lmApiProxy.port": 3000,
  "lmApiProxy.autoStart": false,
  "lmApiProxy.allowCors": true,
  
  // 日志配置
  "lmApiProxy.logLevel": 1,  // 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
  "lmApiProxy.showOutputOnStartup": false
}
```

## 📡 API 速查表

### 健康检查
```bash
GET /health
→ {"status": "ok", "timestamp": "...", "version": "0.0.2"}
```

### 模型列表
```bash
GET /v1/models
→ {"object": "list", "data": [{...}]}
```

### 聊天补全
```bash
POST /v1/chat/completions
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "..."}],
  "max_tokens": 100,
  "stream": false
}
```

### 流式聊天
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

## 💡 常见问题

### Q: 服务器启动失败？
```
检查：
1. GitHub Copilot 是否已激活？
2. 端口 3000 是否被占用？
3. 查看输出面板的错误日志
```

### Q: 模型列表为空？
```
确保：
1. GitHub Copilot 扩展已安装
2. 已登录 GitHub 账号
3. 有有效的 Copilot 订阅
```

### Q: 如何查看详细日志？
```
1. Ctrl+Shift+P → "LM Proxy: Set Log Level"
2. 选择 "DEBUG (0)"
3. Ctrl+Shift+P → "LM Proxy: Show Output Panel"
```

### Q: 如何从其他设备访问？
```
1. 找到本机 IP：ipconfig (Windows) 或 ifconfig (Mac/Linux)
2. 确保防火墙允许端口 3000
3. 使用 http://YOUR_IP:3000 访问
4. 注意安全：仅在受信任的网络中使用！
```

## 🧪 测试命令

```bash
# 健康检查
curl http://127.0.0.1:3000/health

# 获取模型
curl http://127.0.0.1:3000/v1/models

# 聊天（Linux/Mac）
curl -X POST http://127.0.0.1:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# 聊天（Windows PowerShell）
Invoke-RestMethod -Uri "http://127.0.0.1:3000/v1/chat/completions" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"messages":[{"role":"user","content":"Hello"}]}'

# 运行综合测试
python test_comprehensive.py
```

## 📊 状态栏说明

| 显示 | 含义 |
|------|------|
| `✓ LM Proxy:3000` | 服务器运行中（端口 3000） |
| `✗ LM Proxy:Off` | 服务器已停止 |

点击状态栏图标可快速查看状态和操作。

## 🎯 快速调试

### 1. 启用 DEBUG 日志
```
Ctrl+Shift+P → "LM Proxy: Set Log Level" → "DEBUG (0)"
```

### 2. 查看输出
```
Ctrl+Shift+P → "LM Proxy: Show Output Panel"
```

### 3. 运行测试
```bash
python test_comprehensive.py
```

### 4. 检查错误
```
输出面板中查找 [ERROR] 标记
```

## 🌟 高级用法

### 多轮对话
```python
response = requests.post(url, json={
    "messages": [
        {"role": "user", "content": "My name is Alice"},
        {"role": "assistant", "content": "Hello Alice!"},
        {"role": "user", "content": "What's my name?"}
    ]
})
```

### 指定模型
```python
response = requests.post(url, json={
    "model": "gpt-4o",  # 或其他模型 ID
    "messages": [...]
})
```

### 流式处理
```python
response = requests.post(url, json={
    "messages": [...],
    "stream": True
}, stream=True)

for line in response.iter_lines():
    if line.startswith(b'data: '):
        # 处理数据
        pass
```

## 🔗 有用链接

- [完整文档](README.md)
- [改进总结](IMPROVEMENTS.md)
- [测试指南](TESTING.md)
- [GitHub 仓库](https://github.com/lijianjian/LM-API-Proxy-extension)

---

**提示**: 将此文件添加到书签以便快速查阅！
