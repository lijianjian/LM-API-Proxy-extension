# VS Code LM API Proxy 测试示例

## 测试步骤

1. 确保VS Code已安装并激活GitHub Copilot扩展
2. 打开此扩展项目并按F5启动调试模式
3. 在新窗口中运行命令：`Start LM API Proxy Server`
4. 使用以下示例测试API

## 健康检查测试

```bash
curl http://127.0.0.1:3000/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2025-01-21T..."
}
```

## 获取模型列表

```bash
curl http://127.0.0.1:3000/v1/models
```

## 聊天补全测试

```bash
curl -X POST http://127.0.0.1:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "你好，请简单介绍一下你自己"}
    ],
    "max_tokens": 100
  }'
```

## Python测试脚本

创建 `test_proxy.py`:

```python
import requests
import json

def test_health():
    response = requests.get("http://127.0.0.1:3000/health")
    print("Health check:", response.json())

def test_models():
    response = requests.get("http://127.0.0.1:3000/v1/models")
    print("Available models:", json.dumps(response.json(), indent=2))

def test_chat():
    url = "http://127.0.0.1:3000/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    
    data = {
        "model": "gpt-4o",
        "messages": [
            {"role": "user", "content": "请用中文回答：什么是编程？"}
        ],
        "max_tokens": 200
    }
    
    response = requests.post(url, json=data, headers=headers)
    result = response.json()
    
    if "choices" in result:
        print("Chat response:", result["choices"][0]["message"]["content"])
    else:
        print("Error:", result)

if __name__ == "__main__":
    test_health()
    test_models()
    test_chat()
```

运行测试：
```bash
python test_proxy.py
```

## JavaScript测试

创建 `test_proxy.js`:

```javascript
async function testProxy() {
    try {
        // Health check
        const health = await fetch('http://127.0.0.1:3000/health');
        console.log('Health:', await health.json());
        
        // Models
        const models = await fetch('http://127.0.0.1:3000/v1/models');
        console.log('Models:', await models.json());
        
        // Chat completion
        const chatResponse = await fetch('http://127.0.0.1:3000/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'user', content: '请用中文简单解释什么是人工智能？' }
                ],
                max_tokens: 150
            })
        });
        
        const chatData = await chatResponse.json();
        console.log('Chat response:', chatData.choices[0].message.content);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testProxy();
```

运行测试：
```bash
node test_proxy.js
```

## 故障排除

### 常见错误和解决方案

#### 1. "SyntaxError: Unexpected token '<'" 或 JSON解析错误

这通常意味着服务器返回了HTML而不是JSON，可能的原因：

- **服务器未启动**: 确保在VS Code中运行了 `Start LM API Proxy Server` 命令
- **端口冲突**: 检查端口3000是否被其他程序占用
- **URL错误**: 确保使用正确的URL格式

**解决步骤**:
```bash
# 1. 检查端口是否被占用 (Windows)
netstat -ano | findstr :3000

# 2. 测试基本连接
curl http://127.0.0.1:3000/health

# 3. 运行诊断脚本
python test_diagnosis.py
```

#### 2. "无法连接到服务器"

**检查清单**:
- ✅ VS Code已启动扩展调试模式 (F5)
- ✅ 在新窗口中运行了启动命令
- ✅ 状态栏显示 "LM Proxy:3000"
- ✅ GitHub Copilot扩展已安装并激活

#### 3. "No available models found"

**原因和解决**:
- GitHub Copilot未激活或未订阅
- 需要在VS Code中先使用Copilot Chat确认其工作正常
- 检查网络连接和GitHub登录状态

### 快速诊断

运行诊断脚本获取详细信息：

```bash
python test_diagnosis.py
```

这个脚本会：
- 检查服务器连接
- 测试所有API端点
- 提供详细的错误信息
- 验证GitHub Copilot集成

### 端口配置

如果需要更改端口：

1. 打开VS Code设置 (`Ctrl+,`)
2. 搜索 "LM API Proxy"
3. 修改 `lmApiProxy.port` 设置
4. 重启代理服务器

### 开发者工具

在VS Code中查看扩展日志：
1. 打开开发者工具 (`Ctrl+Shift+I`)
2. 查看Console标签页
3. 搜索 "[LM API Proxy]" 日志
