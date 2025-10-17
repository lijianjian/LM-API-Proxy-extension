# 开发指南

本文档帮助开发者设置开发环境并理解项目架构。

## 🚀 快速开始

### 环境要求

- **VS Code** >= 1.102.0
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- **GitHub Copilot** 订阅（用于测试）

### 安装步骤

1. **Clone 仓库**
   ```bash
   git clone https://github.com/lijianjian/LM-API-Proxy-extension.git
   cd LM-API-Proxy-extension
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **编译代码**
   ```bash
   npm run compile
   ```

4. **启动调试**
   - 按 `F5` 或
   - 运行 → 启动调试
   - 选择 "Run Extension"

5. **在新窗口中测试**
   - 新的 VS Code 窗口会打开
   - 运行命令: "LM Proxy: Start Server"
   - 测试API端点

## 📁 项目结构

```
LM-API-Proxy-extension/
├── src/                      # 源代码
│   ├── converter/           # API格式转换器
│   │   ├── openaiConverter.ts    # OpenAI格式
│   │   └── anthropicConverter.ts # Anthropic格式
│   ├── model/              # 模型管理
│   │   └── manager.ts      # ModelManager类
│   ├── server/             # HTTP服务器
│   │   └── server.ts       # Express服务器
│   ├── utils/              # 工具函数
│   │   └── logger.ts       # 日志工具
│   ├── extension.ts        # 扩展入口
│   └── test/               # 单元测试
│       └── extension.test.ts
├── tests/                   # 集成测试
│   ├── test_comprehensive.py
│   ├── test_anthropic.py
│   ├── test_api.sh
│   └── test_api.ps1
├── docs/                    # 文档
│   ├── ANTHROPIC_API.md
│   ├── QUICK_REFERENCE.md
│   └── TROUBLESHOOTING.md
├── dist/                    # 编译输出
├── package.json            # 项目配置
├── tsconfig.json          # TypeScript配置
├── esbuild.js             # 构建脚本
└── README.md              # 项目说明
```

## 🏗️ 架构说明

### 核心组件

#### 1. Extension (extension.ts)
- VS Code 扩展入口
- 注册命令
- 管理扩展生命周期
- 状态栏集成

**关键方法**:
```typescript
export function activate(context: vscode.ExtensionContext)
export function deactivate()
```

#### 2. Server (server/server.ts)
- Express HTTP 服务器
- 路由处理
- 中间件配置
- CORS 支持

**端点**:
- `GET /` - API信息
- `GET /health` - 健康检查
- `GET /v1/models` - 模型列表
- `POST /v1/chat/completions` - OpenAI API
- `POST /v1/messages` - Anthropic API

#### 3. Converters (converter/)
- OpenAI ↔ VS Code LM API
- Anthropic ↔ VS Code LM API
- 流式/非流式转换
- 错误处理

**主要函数**:
```typescript
convertOpenAIRequestToVSCodeRequest()
convertVSCodeResponseToOpenAI()
convertVSCodeStreamToOpenAI()

convertAnthropicRequestToVSCodeRequest()
convertVSCodeResponseToAnthropic()
convertVSCodeStreamToAnthropic()
```

#### 4. Model Manager (model/manager.ts)
- 模型发现和选择
- 模型持久化
- Token 估算

**主要方法**:
```typescript
getAvailableModels()
getDefaultModel()
selectModel()
getModelById()
```

#### 5. Logger (utils/logger.ts)
- 多级日志（DEBUG, INFO, WARN, ERROR）
- VS Code Output Channel集成
- 时间戳和格式化

## 🔧 开发工作流

### 编译和构建

```bash
# 开发编译（含类型检查和lint）
npm run compile

# 仅类型检查
npm run check-types

# 仅 lint
npm run lint

# 自动修复 lint 问题
npm run lint -- --fix

# 监听模式（自动编译）
npm run watch
```

### 调试

#### 调试扩展

1. 设置断点
2. 按 `F5`
3. 在新窗口中触发功能
4. 查看调试控制台

#### 调试配置 (.vscode/launch.json)

```json
{
  "type": "extensionHost",
  "request": "launch",
  "name": "Run Extension",
  "runtimeExecutable": "${execPath}",
  "args": ["--extensionDevelopmentPath=${workspaceFolder}"]
}
```

#### 查看日志

- 运行命令: "LM Proxy: Show Output Panel"
- 或 查看 → 输出 → 选择 "LM API Proxy"

### 测试

#### 运行测试

```bash
# Python 测试
python tests/test_comprehensive.py
python tests/test_anthropic.py

# Shell 测试
bash tests/test_api.sh          # Linux/Mac
.\tests\test_api.ps1            # Windows
```

#### 添加测试

1. 在 `tests/` 目录创建测试文件
2. 遵循现有测试格式
3. 更新 `tests/README.md`

## 📝 代码规范

### TypeScript

```typescript
// 使用接口定义类型
export interface ApiRequest {
    model?: string;
    messages: Message[];
}

// 添加JSDoc注释
/**
 * Convert request format
 * @param request - OpenAI request
 * @returns VS Code request
 */
export function convert(request: ApiRequest): VsCodeRequest {
    // 实现
}

// 使用async/await
async function fetchData(): Promise<Data> {
    const response = await api.get();
    return response.data;
}
```

### 命名约定

```typescript
// 变量和函数
const userName = "John";
function getUserData() {}

// 类和接口
class ModelManager {}
interface UserConfig {}

// 常量
const MAX_RETRIES = 3;
const API_VERSION = "v1";
```

### 错误处理

```typescript
try {
    const result = await operation();
    logger.info('Operation successful');
} catch (error) {
    logger.error('Operation failed', error);
    throw new Error('Descriptive error message');
}
```

## 🔌 VS Code API 使用

### 常用 API

```typescript
// 命令注册
vscode.commands.registerCommand('extension.command', () => {});

// 配置读取
const config = vscode.workspace.getConfiguration('lmApiProxy');
const port = config.get('port', 3000);

// Language Model API
const models = await vscode.lm.selectChatModels();
const response = await model.sendRequest(messages, options);

// 状态栏
const statusBar = vscode.window.createStatusBarItem();
statusBar.text = "Server Running";
statusBar.show();

// 输出通道
const output = vscode.window.createOutputChannel('My Extension');
output.appendLine('Log message');
```

## 📦 打包和发布

### 打包扩展

```bash
# 安装vsce
npm install -g @vscode/vsce

# 打包
vsce package

# 输出: vscode-lm-api-proxy-0.0.3.vsix
```

### 发布到 Marketplace

```bash
# 登录
vsce login <publisher-name>

# 发布
vsce publish

# 或指定版本
vsce publish minor  # 0.0.3 -> 0.1.0
vsce publish major  # 0.0.3 -> 1.0.0
vsce publish patch  # 0.0.3 -> 0.0.4
```

### 发布前检查清单

- [ ] 所有测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] README 准确完整
- [ ] 没有调试代码
- [ ] package.json 元信息正确

## 🐛 常见开发问题

### 问题: 编译错误

```bash
# 清理并重新安装
rm -rf node_modules dist
npm install
npm run compile
```

### 问题: 调试器不工作

- 确保没有其他扩展实例运行
- 重启 VS Code
- 检查 launch.json 配置

### 问题: Language Model API 不可用

- 确保 VS Code 版本 >= 1.102.0
- 确保安装并登录 GitHub Copilot
- 检查 Copilot 状态

## 📚 有用资源

### VS Code 扩展开发

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Language Model API](https://code.visualstudio.com/api/extension-guides/language-model)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)

### API 规范

- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Anthropic API](https://docs.anthropic.com/claude/reference)

### 工具和库

- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [esbuild](https://esbuild.github.io/)

## 🤝 获取帮助

- 📖 阅读 [贡献指南](./CONTRIBUTING.md)
- 💬 加入 [GitHub Discussions](https://github.com/lijianjian/LM-API-Proxy-extension/discussions)
- 🐛 报告 [Issues](https://github.com/lijianjian/LM-API-Proxy-extension/issues)

---

**Happy Coding!** 🎉
