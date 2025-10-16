# VS Code Language Model API Proxy

这是一个VS Code扩展，它将VS Code Language Model API（GitHub Copilot的后端模型）包装成一个本地HTTP代理服务，供同一台机器上的其他程序调用。

## 功能特性

- 🚀 将VS Code LM API封装为标准的HTTP RESTful API
- 🤖 支持多种模型（gpt-4o、gpt-4o-mini、claude-3.5-sonnet等）  
- 💬 兼容OpenAI Chat Completions API格式
- 🔄 支持流式响应（streaming）
- 🛡️ 内置CORS支持，便于跨域调用
- ⚙️ 可配置的端口和自动启动选项
- 📊 实时状态监控和管理

## 系统要求

- VS Code 1.102.0 或更高版本
- GitHub Copilot扩展已安装并已激活
- 有效的GitHub Copilot订阅

## 使用方法

### 网络访问配置

⚠️ **重要安全提示**: 此扩展将API服务器绑定到所有网络接口（0.0.0.0），这意味着：

- ✅ 可以从同一局域网的其他设备访问
- ✅ 方便在不同设备间共享API访问
- ⚠️ 请确保在受信任的网络环境中使用
- ⚠️ 考虑配置防火墙规则限制访问

### 启动代理服务器

1. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
2. 运行命令 `Start LM API Proxy Server`
3. 服务器将在默认端口3000上启动

### 配置选项

- **端口号** (`lmApiProxy.port`): 设置HTTP服务器端口（默认：3000）
- **自动启动** (`lmApiProxy.autoStart`): VS Code启动时自动开启代理服务（默认：false）
- **CORS支持** (`lmApiProxy.allowCors`): 启用跨域请求支持（默认：true）

### API端点

#### 健康检查

```http
GET http://127.0.0.1:3000/health
# 或从网络中其他设备访问：
GET http://[YOUR_IP_ADDRESS]:3000/health
```

#### 获取可用模型列表

```http
GET http://127.0.0.1:3000/v1/models
# 或从网络访问：
GET http://[YOUR_IP_ADDRESS]:3000/v1/models
```

#### 聊天补全（兼容OpenAI格式）

```http
POST http://127.0.0.1:3000/v1/chat/completions
# 或从网络访问：
POST http://[YOUR_IP_ADDRESS]:3000/v1/chat/completions
```

## 命令

- `Start LM API Proxy Server`: 启动代理服务器
- `Stop LM API Proxy Server`: 停止代理服务器  
- `Show LM API Proxy Status`: 显示服务器状态信息

## 示例使用

### Python示例

```python
import requests

# 本地访问
url = "http://127.0.0.1:3000/v1/chat/completions"
# 或网络访问（替换为实际IP地址）
# url = "http://192.168.1.100:3000/v1/chat/completions"

headers = {"Content-Type": "application/json"}

data = {
    "model": "gpt-4o",
    "messages": [
        {"role": "user", "content": "Hello, how are you?"}
    ],
    "max_tokens": 100
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### JavaScript示例

```javascript
// 本地访问
const apiUrl = 'http://127.0.0.1:3000/v1/chat/completions';
// 或网络访问（替换为实际IP地址）
// const apiUrl = 'http://192.168.1.100:3000/v1/chat/completions';

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ],
    max_tokens: 100
  })
});

const data = await response.json();
console.log(data);
```

## 更新日志

### 0.0.1

- 初始版本发布
- 基本的HTTP代理功能
- 支持聊天补全API
- 配置选项和状态管理
