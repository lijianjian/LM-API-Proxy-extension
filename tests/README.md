# 测试文件说明

本目录包含所有测试脚本和工具。

## 测试文件

### Python 测试套件

- **`test_comprehensive.py`** - OpenAI API 完整测试套件
  - 健康检查
  - 模型列表
  - 简单聊天
  - 指定模型
  - 流式输出
  - 多轮对话
  - 温度参数

- **`test_anthropic.py`** - Anthropic API 完整测试套件
  - 非流式请求
  - 流式请求（SSE）
  - 系统提示词
  - 多轮对话
  - 错误处理

- **`debug_test.py`** - 调试和诊断工具
  - 简单请求测试
  - 流式请求测试
  - 详细错误信息

- **`test_diagnosis.py`** - 诊断工具（如果存在）

### Shell 测试脚本

- **`test_api.sh`** - Linux/macOS Bash 测试脚本
  - 支持所有 OpenAI API 测试
  - 彩色输出
  - jq 格式化

- **`test_api.ps1`** - Windows PowerShell 测试脚本
  - 支持所有 OpenAI API 测试
  - 彩色输出
  - Windows 兼容

## 运行测试

### 前置条件

1. **启动服务器**
   ```
   在 VS Code 中运行命令: "LM Proxy: Start Server"
   ```

2. **安装 Python 依赖**
   ```bash
   pip install requests
   ```

### 运行 OpenAI API 测试

```bash
# Python 测试套件
python tests/test_comprehensive.py

# Bash 脚本（Linux/Mac）
bash tests/test_api.sh

# PowerShell 脚本（Windows）
.\tests\test_api.ps1
```

### 运行 Anthropic API 测试

```bash
python tests/test_anthropic.py
```

### 调试工具

```bash
python tests/debug_test.py
```

## 测试配置

所有测试脚本使用的默认配置：

- **服务器地址**: `http://10.14.0.187:3000`
- **超时时间**: 30 秒

如需修改，请编辑各测试文件开头的 `BASE_URL` 变量。

## 测试覆盖

### API 端点

- ✅ `GET /health` - 健康检查
- ✅ `GET /v1/models` - 模型列表
- ✅ `POST /v1/chat/completions` - OpenAI Chat API
- ✅ `POST /v1/messages` - Anthropic Messages API

### 功能测试

- ✅ 非流式响应
- ✅ 流式响应（SSE）
- ✅ 模型选择
- ✅ 参数控制（temperature, max_tokens 等）
- ✅ 多轮对话
- ✅ 系统提示词
- ✅ 错误处理

## 贡献测试

如果你想添加新的测试：

1. 遵循现有测试的格式
2. 添加清晰的注释说明测试目的
3. 确保测试可以独立运行
4. 更新本 README 文档

## 问题报告

如果测试失败，请：

1. 检查服务器是否正常运行
2. 检查网络连接
3. 查看服务器日志（VS Code Output Panel）
4. 尝试提高日志级别到 DEBUG

详见 [故障排除指南](../docs/TROUBLESHOOTING.md)
