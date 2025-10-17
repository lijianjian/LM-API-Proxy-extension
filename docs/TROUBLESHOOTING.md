# 故障排除指南

**语言**: [English](./TROUBLESHOOTING_EN.md) | [中文](./TROUBLESHOOTING.md)

本文档帮助你解决使用 VS Code LM API Proxy 时遇到的常见问题。

## 常见问题 (FAQ)

### Q: 服务器启动失败怎么办？

**症状**: 执行"Start Server"命令后没有反应，或显示错误

**解决方案**:

1. **检查端口是否被占用**
   ```powershell
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. **更改端口**
   - 打开 VS Code 设置
   - 搜索 `lmApiProxy.port`
   - 修改为其他端口（如 3001）

3. **查看输出日志**
   - 运行命令: `LM Proxy: Show Output Panel`
   - 检查错误信息

### Q: 模型列表为空？

**症状**: `/v1/models` 返回空列表

**可能原因**:

1. **未登录 GitHub Copilot**
   - 检查 VS Code 右下角 Copilot 状态
   - 确保已登录并激活

2. **Language Model API 不可用**
   - 需要 VS Code 版本 >= 1.102.0
   - 确保安装了 GitHub Copilot 扩展

**解决方案**:
```
1. 登录 GitHub Copilot
2. 重启 VS Code
3. 重新启动服务器
```

### Q: 请求返回 403 错误？

**症状**: API 请求返回 `NoPermissions` 错误

**原因**: 没有访问 Language Model 的权限

**解决方案**:
1. 确认 GitHub Copilot 订阅有效
2. 检查 Copilot 设置中是否启用了 Chat 功能
3. 尝试在 VS Code Chat 中直接使用，确认可用

### Q: Anthropic API 返回 400 错误？

**症状**: 使用 `/v1/messages` 时返回错误

**常见原因**:

1. **缺少 `max_tokens` 参数**
   ```json
   {
     "error": {
       "type": "invalid_request_error",
       "message": "max_tokens is required and must be greater than 0"
     }
   }
   ```
   **解决**: 添加 `max_tokens` 参数
   ```json
   {
     "model": "claude-3.5-sonnet",
     "max_tokens": 1024,  // 必需！
     "messages": [...]
   }
   ```

2. **消息数组为空**
   - 确保 `messages` 数组至少有一条消息

### Q: 如何查看详细日志？

**步骤**:

1. 设置日志级别为 DEBUG
   ```
   命令: LM Proxy: Set Log Level
   选择: DEBUG (0)
   ```

2. 查看输出面板
   ```
   命令: LM Proxy: Show Output Panel
   ```

3. 执行操作并查看日志

**日志级别**:
- `DEBUG (0)` - 所有调试信息
- `INFO (1)` - 正常操作信息
- `WARN (2)` - 警告信息
- `ERROR (3)` - 仅错误信息

### Q: 如何从其他设备访问？

**前提条件**:
- 服务器监听 `0.0.0.0`（默认配置）
- 防火墙允许端口 3000

**步骤**:

1. **获取本机 IP**
   ```powershell
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. **在其他设备上访问**
   ```bash
   curl http://<本机IP>:3000/health
   ```

3. **如果无法访问，检查防火墙**
   ```powershell
   # Windows - 添加防火墙规则
   New-NetFirewallRule -DisplayName "LM API Proxy" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

### Q: 流式输出没有数据？

**症状**: 设置 `"stream": true` 但没有收到流式数据

**检查点**:

1. **确认使用正确的客户端**
   - 使用支持 SSE 的客户端
   - `curl` 需要 `-N` 参数
   - Python 需要 `stream=True`

2. **正确的示例**:
   ```bash
   # curl
   curl -N -X POST http://10.14.0.187:3000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hi"}],"stream":true}'
   
   # Python
   response = requests.post(url, json=payload, stream=True)
   for line in response.iter_lines():
       print(line)
   ```

3. **中间代理问题**
   - 某些代理服务器会缓冲SSE
   - 尝试直接连接，绕过代理

### Q: 响应很慢怎么办？

**可能原因**:

1. **模型响应时间**
   - 某些模型本身较慢
   - 长提示词需要更多时间

2. **网络延迟**
   - 检查到VS Code主机的网络延迟
   - 尝试使用本地访问（127.0.0.1）

3. **并发请求**
   - Language Model API 可能有速率限制
   - 避免过多并发请求

**优化建议**:
- 使用更快的模型（如 `gpt-4o-mini`）
- 减少 `max_tokens`
- 使用流式输出获得更快的初始响应

### Q: Token 计数为什么都是 0？

**原因**: VS Code Language Model API 不提供 token 统计

**影响**: 
- OpenAI API: `usage.prompt_tokens` 和 `usage.completion_tokens` 始终为 0
- Anthropic API: `usage.input_tokens` 和 `usage.output_tokens` 始终为 0

**这是正常的**，不影响功能使用。

## 错误代码参考

| HTTP状态码 | 错误类型 | 常见原因 | 解决方案 |
|-----------|---------|---------|---------|
| 400 | `invalid_request_error` | 请求参数错误 | 检查请求格式 |
| 403 | `permission_error` | 无权限访问模型 | 检查 Copilot 订阅 |
| 404 | `not_found_error` | 模型不存在 | 检查模型 ID |
| 500 | `api_error` | 服务器内部错误 | 查看日志 |

## 调试技巧

### 1. 使用最小请求测试

```bash
# 最简单的OpenAI请求
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hi"}]}'

# 最简单的Anthropic请求
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3.5-sonnet","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
```

### 2. 启用详细日志

```typescript
// 在扩展开发模式下，可以在浏览器控制台看到详细日志
// 命令: Developer: Toggle Developer Tools
```

### 3. 测试本地连接

先用 `127.0.0.1` 测试，排除网络问题：
```bash
curl http://127.0.0.1:3000/health
```

### 4. 检查依赖版本

```bash
# VS Code 版本
code --version

# Node.js 版本
node --version

# npm 版本
npm --version
```

## 获取帮助

如果以上方法都无法解决你的问题：

1. **查看现有 Issues**
   - [GitHub Issues](https://github.com/lijianjian/LM-API-Proxy-extension/issues)

2. **创建新 Issue**
   - 提供详细的错误信息
   - 包含日志输出
   - 说明重现步骤

3. **提供诊断信息**
   ```
   - VS Code 版本
   - 操作系统
   - 扩展版本
   - 错误日志
   - 请求示例
   ```

## 已知限制

1. **VS Code API 限制**
   - 不支持完整的 OpenAI 参数（temperature, top_p等可能不生效）
   - 无 token 统计
   - 依赖 GitHub Copilot 订阅

2. **模型可用性**
   - 模型可用性取决于 GitHub Copilot
   - 某些模型可能随时间变化

3. **并发限制**
   - Language Model API 可能有速率限制
   - 建议合理控制并发请求

## 相关文档

- [快速参考](./QUICK_REFERENCE.md)
- [API 文档](./ANTHROPIC_API.md)
- [开发指南](../DEVELOPMENT.md)
