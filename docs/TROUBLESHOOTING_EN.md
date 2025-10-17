# Troubleshooting Guide

**Languages**: [English](./TROUBLESHOOTING_EN.md) | [中文](./TROUBLESHOOTING.md)

## 🔍 Quick Diagnostics

Run these commands to quickly identify common issues:

```bash
# Check if server is running
curl http://127.0.0.1:3000/health

# Check port usage
netstat -ano | findstr :3000

# View extension logs
# Ctrl+Shift+P → "LM Proxy: Show Output Panel"
```

## ❓ Frequently Asked Questions

### Installation & Setup

#### Q: Extension won't install

**Symptoms**: Installation fails or extension doesn't appear

**Solutions**:
1. Check VS Code version: Requires **1.102.0+**
   ```bash
   code --version
   ```
2. Verify Node.js: Requires **18.0.0+**
   ```bash
   node --version
   ```
3. Try reinstalling:
   - Uninstall extension
   - Reload VS Code
   - Reinstall from Marketplace

#### Q: Server won't start

**Symptoms**: "Failed to start server" error

**Solutions**:
1. **Port conflict**: Another process using port 3000
   ```powershell
   # Windows
   netstat -ano | findstr :3000
   # Kill the process if needed
   taskkill /PID <PID> /F
   
   # Or change port in settings
   "lmApiProxy.port": 3001
   ```

2. **Copilot not active**: Extension requires GitHub Copilot
   - Install GitHub Copilot extension
   - Sign in to GitHub
   - Verify subscription is active

3. **Permission issues**: VS Code lacks network permissions
   - Run VS Code as administrator (Windows)
   - Check firewall settings

#### Q: No models available

**Symptoms**: `/v1/models` returns empty list or "Select Model" shows nothing

**Solutions**:
1. **Copilot not authenticated**:
   - Open any file
   - Try using Copilot inline suggestions
   - Sign in when prompted

2. **Subscription expired**:
   - Check [GitHub Copilot settings](https://github.com/settings/copilot)
   - Verify subscription status
   - Renew if needed

3. **Refresh model list**:
   - Ctrl+Shift+P → "LM Proxy: Select Model"
   - Wait for model list to load
   - Try restarting VS Code

### API Usage

#### Q: 401 Unauthorized error

**Symptoms**: API returns authentication error

**Solutions**:
1. This proxy doesn't require authentication
2. If using with other tools, remove API key headers
3. Check that you're connecting to correct endpoint:
   ```
   http://127.0.0.1:3000  ✅
   https://api.openai.com ❌
   ```

#### Q: Rate limit errors

**Symptoms**: "Rate limit exceeded" or 429 errors

**Solutions**:
1. **This is from GitHub Copilot backend**:
   - Wait 1-2 minutes between requests
   - Reduce concurrent requests
   - Check Copilot quota/limits

2. **Implement retry logic**:
   ```python
   import time
   import requests
   
   def chat_with_retry(message, max_retries=3):
       for i in range(max_retries):
           try:
               response = requests.post(
                   "http://127.0.0.1:3000/v1/chat/completions",
                   json={"messages": [{"role": "user", "content": message}]}
               )
               if response.status_code == 200:
                   return response.json()
               elif response.status_code == 429:
                   wait_time = 2 ** i  # Exponential backoff
                   print(f"Rate limited. Waiting {wait_time}s...")
                   time.sleep(wait_time)
           except Exception as e:
               print(f"Error: {e}")
       return None
   ```

#### Q: Streaming not working

**Symptoms**: Stream response returns all at once or doesn't work

**Solutions**:
1. **Check stream parameter**:
   ```json
   {"stream": true}  ✅
   {"stream": false} ❌
   ```

2. **Python client**: Use `stream=True` in requests
   ```python
   response = requests.post(
       url,
       json={"messages": [...], "stream": True},
       stream=True  # Important!
   )
   
   for line in response.iter_lines():
       if line:
           print(line.decode('utf-8'))
   ```

3. **Check Content-Type**: Should be `text/event-stream`

#### Q: Anthropic API not working

**Symptoms**: `/v1/messages` endpoint returns errors

**Solutions**:
1. **Include required header**:
   ```python
   headers = {"anthropic-version": "2023-06-01"}
   ```

2. **Check request format**:
   ```python
   # Correct Anthropic format
   {
       "model": "claude-3-5-sonnet-20241022",
       "messages": [{"role": "user", "content": "Hello"}],
       "max_tokens": 1024  # Required for Anthropic
   }
   ```

3. **Model name**: Use Anthropic model names
   - ✅ `claude-3-5-sonnet-20241022`
   - ❌ `gpt-4o`

### Performance Issues

#### Q: Slow response times

**Symptoms**: Requests take too long

**Solutions**:
1. **Check model**: Some models are slower
   - Fast: `gpt-4o-mini`, `claude-3-5-haiku`
   - Slow: `o1-preview`, `o1`

2. **Reduce max_tokens**:
   ```json
   {"max_tokens": 500}  // Faster
   ```

3. **Use streaming**: Perceived faster response
   ```json
   {"stream": true}
   ```

4. **Check network**: VS Code extension runs locally but calls Copilot backend
   - Test internet speed
   - Check VS Code proxy settings

#### Q: Memory issues

**Symptoms**: High memory usage or crashes

**Solutions**:
1. **Limit conversation history**:
   ```python
   # Keep only recent messages
   messages = messages[-10:]  # Last 10 messages
   ```

2. **Restart server periodically**:
   - Ctrl+Shift+P → "LM Proxy: Stop Server"
   - Ctrl+Shift+P → "LM Proxy: Start Server"

3. **Adjust VS Code memory**:
   ```bash
   code --max-memory=4096
   ```

### Configuration

#### Q: Settings not taking effect

**Symptoms**: Changed settings but behavior unchanged

**Solutions**:
1. **Restart server**: Required for some settings
   - Stop and start server
   - Or reload VS Code window

2. **Check settings location**:
   - User settings: Apply globally
   - Workspace settings: Override user settings
   - Check which takes precedence

3. **Verify JSON syntax**:
   ```json
   {
     "lmApiProxy.port": 3000,  // ✅
     "lmApiProxy.port": 3000   // ❌ Missing comma
   }
   ```

#### Q: CORS errors

**Symptoms**: Browser requests fail with CORS error

**Solutions**:
1. **Enable CORS in settings**:
   ```json
   {
     "lmApiProxy.allowCors": true
   }
   ```

2. **Restart server** after changing setting

3. **For local testing**: CORS shouldn't be an issue when calling from same machine

### Logging & Debugging

#### Q: How to enable debug logging

**Solutions**:
1. **Set log level to DEBUG**:
   - Ctrl+Shift+P → "LM Proxy: Set Log Level"
   - Select "DEBUG (0)"

2. **Or in settings**:
   ```json
   {
     "lmApiProxy.logLevel": 0
   }
   ```

3. **View logs**:
   - Ctrl+Shift+P → "LM Proxy: Show Output Panel"

#### Q: How to report bugs

**Steps**:
1. **Enable DEBUG logging** (see above)
2. **Reproduce the issue**
3. **Collect information**:
   - VS Code version
   - Extension version
   - Operating system
   - Error messages from Output panel
   - Request/response examples

4. **Create GitHub issue**: [Report here](https://github.com/lijianjian/vs-code-lm-api-proxy/issues)

## 🛠️ Advanced Troubleshooting

### Network Debugging

```powershell
# Test basic connectivity
curl http://127.0.0.1:3000/health

# Test with verbose output
curl -v http://127.0.0.1:3000/v1/models

# Test streaming
curl -N http://127.0.0.1:3000/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}],\"stream\":true}"
```

### Extension Debugging

1. **Open extension development**:
   - Clone repository
   - Open in VS Code
   - Press F5 to launch Extension Development Host

2. **Set breakpoints** in TypeScript code

3. **Check VS Code logs**:
   - Help → Toggle Developer Tools
   - Console tab

### VS Code Language Model API Issues

If the underlying VS Code LM API has problems:

1. **Check VS Code Insiders**: May have fixes
2. **Verify Copilot API access**:
   ```typescript
   const models = await vscode.lm.selectChatModels();
   console.log(models.length); // Should be > 0
   ```
3. **Report to VS Code**: [VS Code GitHub](https://github.com/microsoft/vscode/issues)

## 📚 Additional Resources

- [Quick Reference](./QUICK_REFERENCE_EN.md)
- [API Documentation](./ANTHROPIC_API_EN.md)
- [Test Commands](./TEST_COMMANDS_EN.md)
- [GitHub Issues](https://github.com/lijianjian/vs-code-lm-api-proxy/issues)

---

**Still stuck?** [Open an issue](https://github.com/lijianjian/vs-code-lm-api-proxy/issues) with details and we'll help!
