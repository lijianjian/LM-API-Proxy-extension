# VS Code Language Model API Proxy

[![Version](https://img.shields.io/badge/version-0.0.3-blue.svg)](https://github.com/lijianjian/vs-code-lm-api-proxy)
[![VS Code](https://img.shields.io/badge/VS%20Code-%3E%3D1.102.0-007ACC.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

> **📖 Documentation**: [English](./docs/README_EN.md) | [中文](./docs/README.md) | [All Docs](./DOCUMENTATION.md)

---

[English](#english) | [中文](#中文)

---



**OpenAI & Anthropic 兼容的本地 AI API 代理服务器**## 中文



将 VS Code Language Model API（GitHub Copilot）包装成标准的 HTTP REST API，支持 OpenAI 和 Anthropic 格式。这是一个 VS Code 扩展，它将 VS Code Language Model API（GitHub Copilot 的后端模型）包装成一个本地 HTTP 代理服务，供同一台机器或局域网内的其他程序调用。



[English](#english) | [中文](#中文)### ✨ 功能特性



---- 🚀 **OpenAI 兼容 API** - 将 VS Code LM API 封装为标准的 OpenAI Chat Completions API 格式

- 🤖 **多模型支持** - 支持 gpt-4o、gpt-4o-mini、claude-3.5-sonnet 等多种模型  

## 中文- 🔄 **流式响应** - 完整支持 Server-Sent Events (SSE) 流式传输

- 🎯 **智能模型管理** - 可选择特定模型或使用默认模型，支持模型持久化

### ✨ 特性- 📊 **高级日志系统** - 支持 DEBUG/INFO/WARN/ERROR 四级日志，便于调试

- 🛡️ **CORS 支持** - 内置跨域请求支持

- 🔌 **双 API 格式支持**- 🌐 **网络访问** - 服务器绑定到所有网络接口，支持局域网访问

  - OpenAI Chat Completions API (`/v1/chat/completions`)- ⚙️ **灵活配置** - 可配置端口、自动启动、日志级别等选项

  - Anthropic Messages API (`/v1/messages`)

  ### 📋 系统要求

- 🤖 **20+ AI 模型**

  - GPT-4, GPT-4o, GPT-5 系列- VS Code 1.102.0 或更高版本

  - Claude 3.5, 3.7, 4, 4.5 Sonnet- GitHub Copilot 扩展已安装并激活

  - Gemini 2.0, 2.5 Pro- 有效的 GitHub Copilot 订阅

  - 更多模型...

### 🚀 快速开始

- ⚡ **完整功能**

  - 流式和非流式输出#### 1. 启动服务器

  - 多轮对话支持

  - 系统提示词1. 按 `F5` 启动扩展开发模式

  - 参数控制2. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）

3. 运行 `LM Proxy: Start Server`

- 🌐 **局域网访问**4. 服务器将在端口 3000 上启动

  - 本地开发测试

  - 团队共享使用#### 2. 测试 API

  - 跨设备调用

```bash

### 🚀 快速开始# 健康检查

curl http://127.0.0.1:3000/health

#### 1. 前置要求

# 获取可用模型

- VS Code >= 1.102.0curl http://127.0.0.1:3000/v1/models

- GitHub Copilot 订阅（已登录）

# 发送聊天请求

#### 2. 安装扩展curl http://127.0.0.1:3000/v1/chat/completions \

  -H "Content-Type: application/json" \

从 [VS Code Marketplace](https://marketplace.visualstudio.com/) 安装或：  -d '{

    "messages": [{"role": "user", "content": "Hello!"}],

```bash    "max_tokens": 100

# 从源码安装  }'

git clone https://github.com/lijianjian/LM-API-Proxy-extension.git```

cd LM-API-Proxy-extension

npm install### 📋 可用命令

npm run compile

# 按 F5 启动调试| 命令 | 描述 |

```|------|------|

| `LM Proxy: Start Server` | 启动代理服务器 |

#### 3. 启动服务器| `LM Proxy: Stop Server` | 停止代理服务器 |

| `LM Proxy: Show Status` | 显示服务器状态 |

在 VS Code 命令面板 (Ctrl+Shift+P / Cmd+Shift+P) 中运行：| `LM Proxy: Select Model` | 选择要使用的语言模型 |

| `LM Proxy: Set Log Level` | 设置日志级别 |

```| `LM Proxy: Show Output Panel` | 显示输出面板 |

LM Proxy: Start Server| `LM Proxy: Clear Output Panel` | 清空输出面板 |

```

### 📡 API 文档

服务器将在 `http://0.0.0.0:3000` 启动

#### GET `/health`

#### 4. 测试连接健康检查端点



```bash**响应:**

curl http://localhost:3000/health```json

# {"status":"ok","timestamp":"2025-10-17T...","version":"0.0.3"}{

```  "status": "ok",

  "timestamp": "2025-01-21T...",

### 📖 API 使用  "version": "0.0.2"

}

#### OpenAI 格式```



```bash#### GET `/v1/models`

curl -X POST http://localhost:3000/v1/chat/completions \获取可用模型列表

  -H "Content-Type: application/json" \

  -d '{**响应:**

    "model": "gpt-4o",```json

    "messages": [{

      {"role": "user", "content": "Hello!"}  "object": "list",

    ]  "data": [

  }'    {

```      "id": "gpt-4o",

      "object": "model",

#### Anthropic 格式      "name": "GPT-4o",

      "vendor": "copilot",

```bash      "family": "gpt-4o",

curl -X POST http://localhost:3000/v1/messages \      "max_input_tokens": 128000

  -H "Content-Type: application/json" \    }

  -d '{  ]

    "model": "claude-3.5-sonnet",}

    "max_tokens": 1024,```

    "messages": [

      {"role": "user", "content": "Hello!"}#### POST `/v1/chat/completions`

    ]创建聊天补全（OpenAI 兼容）

  }'

```**请求体:**

```json

#### Python 示例{

  "model": "gpt-4o",  // 可选，省略则使用默认模型

```python  "messages": [

import requests    {"role": "system", "content": "You are a helpful assistant."},

    {"role": "user", "content": "Hello!"}

# OpenAI 格式  ],

response = requests.post(  "max_tokens": 100,

    "http://localhost:3000/v1/chat/completions",  "temperature": 0.7,  // VS Code LM API 可能不支持

    json={  "stream": false      // true 启用流式响应

        "messages": [{"role": "user", "content": "Hello"}]}

    }```

)

print(response.json()["choices"][0]["message"]["content"])**非流式响应:**

```json

# Anthropic 格式{

response = requests.post(  "id": "chatcmpl-xxx",

    "http://localhost:3000/v1/messages",  "object": "chat.completion",

    json={  "created": 1705881600,

        "model": "claude-3.5-sonnet",  "model": "gpt-4o",

        "max_tokens": 1024,  "choices": [

        "messages": [{"role": "user", "content": "Hello"}]    {

    }      "index": 0,

)      "message": {

print(response.json()["content"][0]["text"])        "role": "assistant",

```        "content": "Hello! How can I help you?"

      },

### 📚 文档      "finish_reason": "stop"

    }

- **[快速参考指南](./docs/QUICK_REFERENCE.md)** - 常用命令和配置  ],

- **[Anthropic API 文档](./docs/ANTHROPIC_API.md)** - Anthropic Messages API 详细说明  "usage": {

- **[测试命令](./docs/TEST_COMMANDS.md)** - 快速测试命令    "prompt_tokens": 0,

- **[故障排除](./docs/TROUBLESHOOTING.md)** - 常见问题解决方案    "completion_tokens": 0,

- **[开发指南](./DEVELOPMENT.md)** - 开发环境设置    "total_tokens": 0

- **[贡献指南](./CONTRIBUTING.md)** - 如何贡献代码  }

}

### 🎯 使用场景```



- **本地开发测试** - 无需 API Key 即可测试 AI 应用**流式响应 (SSE):**

- **团队协作** - 共享 GitHub Copilot 订阅```

- **SDK 集成** - 兼容 OpenAI/Anthropic SDKdata: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1705881600,"model":"gpt-4o","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

- **工具集成** - LangChain, LlamaIndex 等框架

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1705881600,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

### ⚙️ 配置

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1705881600,"model":"gpt-4o","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

在 VS Code 设置中配置：

data: [DONE]

| 设置项 | 默认值 | 说明 |```

|--------|--------|------|

| `lmApiProxy.port` | 3000 | 服务器端口 |### 💻 使用示例

| `lmApiProxy.allowCors` | true | 允许 CORS |

| `lmApiProxy.logLevel` | 1 (INFO) | 日志级别 |#### Python

| `lmApiProxy.showOutputOnStartup` | false | 启动时显示输出 |

| `lmApiProxy.networkInterface` | 0.0.0.0 | 网络接口 |```python

import requests

### 🎨 可用命令import json



- `LM Proxy: Start Server` - 启动服务器# 简单聊天

- `LM Proxy: Stop Server` - 停止服务器response = requests.post(

- `LM Proxy: Show Status` - 显示状态    "http://127.0.0.1:3000/v1/chat/completions",

- `LM Proxy: Select Model` - 选择默认模型    json={

- `LM Proxy: Set Log Level` - 设置日志级别        "messages": [

- `LM Proxy: Show Output Panel` - 显示日志            {"role": "user", "content": "What is Python?"}

- `LM Proxy: Clear Output` - 清除日志        ],

        "max_tokens": 150

### 🧪 测试    }

)

```bash

# Python 测试套件result = response.json()

python tests/test_comprehensive.py  # OpenAI APIprint(result["choices"][0]["message"]["content"])

python tests/test_anthropic.py      # Anthropic API

# 流式聊天

# Shell 测试脚本response = requests.post(

bash tests/test_api.sh              # Linux/Mac    "http://127.0.0.1:3000/v1/chat/completions",

.\tests\test_api.ps1                # Windows    json={

```        "messages": [

            {"role": "user", "content": "Count to 5"}

### 🤝 贡献        ],

        "stream": True

欢迎贡献！请查看 [贡献指南](./CONTRIBUTING.md)    },

    stream=True

- 报告 Bug)

- 提出功能建议

- 提交 Pull Requestfor line in response.iter_lines():

- 改进文档    if line:

        line_text = line.decode('utf-8')

### 📄 许可证        if line_text.startswith('data: '):

            data = line_text[6:]

[MIT License](./LICENSE)            if data != '[DONE]':

                chunk = json.loads(data)

### 🙏 致谢                content = chunk['choices'][0]['delta'].get('content', '')

                if content:

- 参考项目: [ryonakae/vscode-lm-proxy](https://github.com/ryonakae/vscode-lm-proxy)                    print(content, end='', flush=True)

- VS Code [Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)```

- 所有贡献者

#### JavaScript/TypeScript

---

```javascript

## English// 简单聊天

const response = await fetch('http://127.0.0.1:3000/v1/chat/completions', {

### ✨ Features    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

- 🔌 **Dual API Format Support**    body: JSON.stringify({

  - OpenAI Chat Completions API (`/v1/chat/completions`)        messages: [{ role: 'user', content: 'What is JavaScript?' }],

  - Anthropic Messages API (`/v1/messages`)        max_tokens: 150

      })

- 🤖 **20+ AI Models**});

  - GPT-4, GPT-4o, GPT-5 series

  - Claude 3.5, 3.7, 4, 4.5 Sonnetconst data = await response.json();

  - Gemini 2.0, 2.5 Proconsole.log(data.choices[0].message.content);

  - And more...

// 流式聊天

- ⚡ **Full Features**const streamResponse = await fetch('http://127.0.0.1:3000/v1/chat/completions', {

  - Streaming & non-streaming    method: 'POST',

  - Multi-turn conversations    headers: { 'Content-Type': 'application/json' },

  - System prompts    body: JSON.stringify({

  - Parameter control        messages: [{ role: 'user', content: 'Count to 5' }],

        stream: true

- 🌐 **LAN Access**    })

  - Local development});

  - Team sharing

  - Cross-device accessconst reader = streamResponse.body.getReader();

const decoder = new TextDecoder();

### 🚀 Quick Start

while (true) {

#### 1. Prerequisites    const { done, value } = await reader.read();

    if (done) break;

- VS Code >= 1.102.0    

- GitHub Copilot subscription (signed in)    const chunk = decoder.decode(value);

    const lines = chunk.split('\n');

#### 2. Install Extension    

    for (const line of lines) {

Install from [VS Code Marketplace](https://marketplace.visualstudio.com/) or:        if (line.startsWith('data: ')) {

            const data = line.slice(6);

```bash            if (data !== '[DONE]') {

# Install from source                const parsed = JSON.parse(data);

git clone https://github.com/lijianjian/LM-API-Proxy-extension.git                const content = parsed.choices[0]?.delta?.content || '';

cd LM-API-Proxy-extension                if (content) process.stdout.write(content);

npm install            }

npm run compile        }

# Press F5 to debug    }

```}

```

#### 3. Start Server

### ⚙️ 配置选项

Run in VS Code Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

在 VS Code 设置中配置（`settings.json`）：

```

LM Proxy: Start Server```json

```{

  "lmApiProxy.port": 3000,

Server starts at `http://0.0.0.0:3000`  "lmApiProxy.autoStart": false,

  "lmApiProxy.allowCors": true,

#### 4. Test Connection  "lmApiProxy.logLevel": 1,

  "lmApiProxy.showOutputOnStartup": false

```bash}

curl http://localhost:3000/health```

# {"status":"ok","timestamp":"2025-10-17T...","version":"0.0.3"}

```| 配置项 | 类型 | 默认值 | 描述 |

|--------|------|--------|------|

### 📖 API Usage| `port` | number | 3000 | HTTP 服务器端口 |

| `autoStart` | boolean | false | VS Code 启动时自动开启代理 |

#### OpenAI Format| `allowCors` | boolean | true | 启用 CORS 支持 |

| `logLevel` | number | 1 | 日志级别: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR |

```bash| `showOutputOnStartup` | boolean | false | 启动时显示输出面板 |

curl -X POST http://localhost:3000/v1/chat/completions \

  -H "Content-Type: application/json" \### 🧪 测试

  -d '{

    "model": "gpt-4o",运行综合测试：

    "messages": [

      {"role": "user", "content": "Hello!"}```bash

    ]python test_comprehensive.py

  }'```

```

测试内容：

#### Anthropic Format- ✅ 健康检查

- ✅ API 信息

```bash- ✅ 模型列表

curl -X POST http://localhost:3000/v1/messages \- ✅ 简单聊天

  -H "Content-Type: application/json" \- ✅ 指定模型聊天

  -d '{- ✅ 流式响应

    "model": "claude-3.5-sonnet",- ✅ 多轮对话

    "max_tokens": 1024,

    "messages": [### 🏗️ 项目结构

      {"role": "user", "content": "Hello!"}

    ]```

  }'src/

```├── extension.ts              # 扩展入口

├── converter/

### 📚 Documentation│   └── openaiConverter.ts    # OpenAI 格式转换

├── model/

- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common commands and config│   └── manager.ts            # 模型管理

- **[Anthropic API](./docs/ANTHROPIC_API.md)** - Anthropic Messages API details├── server/

- **[Test Commands](./docs/TEST_COMMANDS.md)** - Quick test commands│   └── server.ts             # HTTP 服务器

- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues└── utils/

- **[Development Guide](./DEVELOPMENT.md)** - Dev environment setup    └── logger.ts             # 日志工具

- **[Contributing](./CONTRIBUTING.md)** - How to contribute```



### 🤝 Contributing### 🔒 安全提示



Contributions welcome! See [Contributing Guide](./CONTRIBUTING.md)⚠️ **重要**: 此扩展将服务器绑定到 `0.0.0.0`，意味着：



### 📄 License- ✅ 可从局域网其他设备访问

- ⚠️ 请在受信任的网络中使用

[MIT License](./LICENSE)- ⚠️ 建议配置防火墙规则

- ⚠️ 不要暴露到公网

### 🙏 Credits

### 🤝 贡献

- Inspired by: [ryonakae/vscode-lm-proxy](https://github.com/ryonakae/vscode-lm-proxy)

- VS Code [Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)欢迎提交 Issue 和 Pull Request！

- All contributors

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
