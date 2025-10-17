# 贡献指南

感谢你考虑为 VS Code LM API Proxy 做贡献！我们欢迎所有形式的贡献。

## 🌟 贡献方式

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 开发新功能
- 🧪 编写测试
- 🌐 翻译文档

## 📋 开始之前

1. **搜索现有 Issues**  
   在创建新 Issue 前，请先搜索是否已有相关讨论

2. **阅读文档**  
   - [README](./README.md)
   - [开发指南](./DEVELOPMENT.md)
   - [API 文档](./docs/)

3. **了解项目结构**  
   查看 [DEVELOPMENT.md](./DEVELOPMENT.md#项目结构) 了解代码组织

## 🐛 报告 Bug

### Bug 报告应包含

- **清晰的标题** - 简短描述问题
- **重现步骤** - 详细说明如何重现
- **期望行为** - 你期望发生什么
- **实际行为** - 实际发生了什么
- **环境信息**:
  - VS Code 版本
  - 操作系统
  - 扩展版本
  - Node.js 版本

### Bug 报告模板

```markdown
**描述问题**
简短描述bug

**重现步骤**
1. 启动服务器
2. 发送请求 '...'
3. 查看错误 '...'

**期望行为**
应该返回正常响应

**实际行为**
返回500错误

**环境**
- VS Code: 1.102.0
- OS: Windows 11
- Extension: 0.0.3
- Node.js: v18.17.0

**日志**
```
粘贴相关日志
```
```

## 💡 功能建议

### 好的功能建议包含

- **问题描述** - 你想解决什么问题？
- **建议方案** - 你的解决思路
- **使用场景** - 何时会用到这个功能？
- **替代方案** - 还考虑过什么其他方法？

## 🔧 提交代码

### 开发流程

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **Clone 到本地**
   ```bash
   git clone https://github.com/YOUR_USERNAME/LM-API-Proxy-extension.git
   cd LM-API-Proxy-extension
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/bug-description
   ```

5. **开发和测试**
   ```bash
   # 编译
   npm run compile
   
   # 运行测试
   npm test
   
   # 调试 - 按 F5 启动调试
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

7. **推送到 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建 Pull Request**
   - 在 GitHub 上打开你的 Fork
   - 点击 "New Pull Request"
   - 填写 PR 描述

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不是新功能也不是bug修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```bash
feat(anthropic): add streaming support for Messages API

- Implement SSE event types
- Add stream conversion function
- Update tests

Closes #123
```

### 代码规范

1. **TypeScript 规范**
   - 使用 TypeScript 严格模式
   - 所有函数添加类型注解
   - 使用 `interface` 定义类型

2. **命名规范**
   - 变量/函数: `camelCase`
   - 类/接口: `PascalCase`
   - 常量: `UPPER_SNAKE_CASE`
   - 文件名: `kebab-case.ts`

3. **注释规范**
   ```typescript
   /**
    * 函数功能描述
    * @param paramName - 参数说明
    * @returns 返回值说明
    */
   export function functionName(paramName: string): ReturnType {
       // 实现
   }
   ```

4. **代码格式**
   ```bash
   # 运行 lint
   npm run lint
   
   # 自动修复
   npm run lint -- --fix
   ```

### 测试要求

1. **为新功能编写测试**
   - 单元测试（如需要）
   - 集成测试

2. **确保现有测试通过**
   ```bash
   # 运行所有测试
   python tests/test_comprehensive.py
   python tests/test_anthropic.py
   ```

3. **测试覆盖**
   - 正常情况
   - 边界情况
   - 错误情况

## 📝 文档贡献

### 文档类型

- **API 文档** - 位于 `docs/`
- **用户文档** - README, 快速参考等
- **开发文档** - DEVELOPMENT.md
- **注释** - 代码内文档

### 文档规范

1. **清晰简洁** - 避免冗长
2. **提供示例** - 代码示例很重要
3. **保持更新** - 代码改变时更新文档
4. **双语支持** - 中英文都提供（如适用）

## 🎨 UI/UX 贡献

- **命令名称** - 保持简洁清晰
- **错误消息** - 提供有用的错误信息
- **状态栏** - 显示关键状态信息

## 🧪 测试贡献

### 添加测试

1. **Python 测试** - 位于 `tests/`
2. **Shell 脚本** - Bash 和 PowerShell
3. **VS Code 测试** - `src/test/`

### 测试命名

```python
def test_feature_name_scenario():
    """Test description"""
    # 测试代码
```

## 📦 发布流程

（仅限维护者）

1. **更新版本号**
   ```bash
   npm version patch  # 0.0.3 -> 0.0.4
   npm version minor  # 0.0.3 -> 0.1.0
   npm version major  # 0.0.3 -> 1.0.0
   ```

2. **更新 CHANGELOG**
   - 记录所有更改
   - 按类型分组

3. **打包扩展**
   ```bash
   npm run package
   vsce package
   ```

4. **发布到 Marketplace**
   ```bash
   vsce publish
   ```

## ❓ 获取帮助

需要帮助？

- 💬 [GitHub Discussions](https://github.com/lijianjian/LM-API-Proxy-extension/discussions) - 提问和讨论
- 🐛 [GitHub Issues](https://github.com/lijianjian/LM-API-Proxy-extension/issues) - 报告bug和功能请求
- 📖 [文档](./docs/README.md) - 查看文档

## 📜 行为准则

请遵守我们的 [行为准则](./CODE_OF_CONDUCT.md)：

- **友好尊重** - 对待所有贡献者
- **包容开放** - 欢迎不同观点
- **建设性反馈** - 提供有帮助的建议
- **专注改进** - 帮助项目变得更好

## 🏆 贡献者

感谢所有贡献者！

查看 [贡献者列表](https://github.com/lijianjian/LM-API-Proxy-extension/graphs/contributors)

## 📄 许可证

贡献代码即表示你同意以项目的许可证（MIT）分发你的贡献。

---

**再次感谢你的贡献！** 🎉

每一个 PR、Issue 和建议都让这个项目变得更好！
