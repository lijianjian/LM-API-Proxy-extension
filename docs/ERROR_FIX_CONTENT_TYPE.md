# VS Code LM API "Unexpected content type" Error Fix

## 问题描述 / Problem Description

### 错误信息 / Error Message

```
Error: Unexpected chat message content type llm 2
```

### 发生位置 / Location
- 调用 `model.sendRequest()` 时
- 在 `handleAnthropicNonStreamingRequest` 和其他请求处理函数中
- VS Code Language Model API 内部抛出

## 根本原因 / Root Cause

VS Code Language Model API 返回了新的内容类型 `llm 2`，这可能是由于:

1. **VS Code 版本更新** - 新版 VS Code 引入了新的响应格式
2. **模型响应格式变化** - 某些模型（如新版 Claude 或 GPT）使用了新格式
3. **API 版本不匹配** - 扩展代码尚未适配最新的 VS Code LM API

## 解决方案 / Solution

### 1. 添加错误捕获和处理

已在以下函数中添加了错误处理：

- ✅ `handleNonStreamingRequest` (OpenAI 非流式)
- ✅ `handleStreamingRequest` (OpenAI 流式)
- ✅ `handleAnthropicNonStreamingRequest` (Anthropic 非流式)
- ✅ `handleAnthropicStreamingRequest` (Anthropic 流式)

### 2. 错误处理逻辑

```typescript
try {
    response = await model.sendRequest(messages, options);
} catch (apiError: any) {
    if (apiError.message && apiError.message.includes('Unexpected chat message content type')) {
        logger.error('VS Code LM API returned unsupported content type', {
            error: apiError.message,
            model: model.id,
            hint: 'Try a different model or update VS Code'
        });
        throw new Error(`Model ${model.id} returned unsupported response format. Try a different model or update VS Code.`);
    }
    throw apiError;
}
```

### 3. 用户友好的错误消息

现在用户会收到清晰的错误提示：

```json
{
  "error": {
    "message": "Model claude-3-5-sonnet-20241022 returned unsupported response format. Try a different model or update VS Code.",
    "type": "api_error",
    "code": "unsupported_format"
  }
}
```

## 临时解决方案 / Workarounds

### 方案 1: 切换模型

某些模型可能工作正常，尝试：

```bash
# 测试 GPT 模型
curl http://10.14.0.187:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 测试 Claude 3 (旧版本)
curl http://10.14.0.187:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 方案 2: 更新 VS Code

```bash
# 检查 VS Code 版本
code --version

# 建议版本
# VS Code >= 1.102.0
```

### 方案 3: 使用 OpenAI API 而非 Anthropic API

如果 Anthropic API 格式有问题，尝试使用 OpenAI 格式：

```python
# 使用 OpenAI 格式访问 Claude 模型
import requests

response = requests.post(
    "http://10.14.0.187:3000/v1/chat/completions",
    json={
        "model": "claude-3-5-sonnet-20241022",
        "messages": [{"role": "user", "content": "Hello"}]
    }
)
```

## 调试步骤 / Debugging Steps

### 1. 启用 DEBUG 日志

```
命令面板 → LM Proxy: Set Log Level → DEBUG (0)
```

### 2. 查看详细错误信息

```
命令面板 → LM Proxy: Show Output Panel
```

你会看到：

```
[ERROR] VS Code LM API returned unsupported content type
  model: claude-3-5-sonnet-20241022
  error: Unexpected chat message content type llm 2
  hint: This may be due to VS Code API version mismatch or model-specific response format
```

### 3. 测试不同模型

```bash
# 获取可用模型列表
curl http://10.14.0.187:3000/v1/models

# 逐个测试
for model in gpt-4o gpt-4o-mini claude-3-sonnet-20240229; do
  echo "Testing $model..."
  curl -s http://10.14.0.187:3000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}]}" \
    | jq .
done
```

## 已知工作的模型 / Known Working Models

根据测试，以下模型通常工作正常：

✅ **GPT 系列**
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4-turbo`

✅ **Claude 旧版本**
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

⚠️ **可能有问题的模型**
- `claude-3-5-sonnet-20241022` (最新版)
- `claude-3-7-sonnet-20250219` (最新版)
- 其他 2024 年底/2025 年的新模型

## 长期解决方案 / Long-term Solution

### 需要的改进：

1. **VS Code API 更新适配**
   - 监控 VS Code LM API 变更
   - 适配新的内容类型

2. **更好的模型兼容性检测**
   - 在启动时检测模型兼容性
   - 标记不兼容的模型

3. **自动降级/重试**
   - 检测到不支持的格式时自动尝试其他模型
   - 或使用备选 API 格式

4. **更新文档**
   - 列出已验证兼容的模型
   - 提供模型选择建议

## 相关链接 / Related Links

- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
- [GitHub Issues](https://github.com/lijianjian/vs-code-lm-api-proxy/issues)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

## 报告问题 / Report Issues

如果遇到此错误，请报告：

1. **VS Code 版本**: `code --version`
2. **模型名称**: 出错的模型 ID
3. **完整错误日志**: 从 Output Panel 复制
4. **请求示例**: 触发错误的 curl 命令

在 [GitHub Issues](https://github.com/lijianjian/vs-code-lm-api-proxy/issues) 创建新 issue。

---

**更新日期**: 2025-10-17  
**版本**: 0.0.3+
