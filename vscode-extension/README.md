# Git Commit Message Generator

[![VS Code](https://img.shields.io/badge/VS%20Code-^1.120.0-blue?logo=visual-studio-code)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

基于 AI 自动生成 Git 提交信息的 VS Code 扩展。通过分析 **已暂存的变更（staged changes）**，结合 DeepSeek 大模型，智能生成高质量的 Git Commit Message，帮助你写出规范、清晰的提交记录。

## ✨ 功能特性

- 🤖 **AI 驱动**：使用 DeepSeek V4 系列模型，理解代码变更上下文，生成有意义的提交信息
- 🖱️ **一键生成**：在 SCM（源代码管理）面板的标题栏点击 ✨ 按钮即可生成
- 📋 **自动填充**：生成的提交信息会自动填入 Git 输入框，可直接提交或修改
- ✏️ **自定义 Prompt**：支持在 VS Code 设置中配置自定义提示词，或指定外部 prompt 文件
- 📊 **详细日志**：内置输出通道，可查看 AI 调用过程和分析结果
- ⚡ **缓存优化**：同一仓库复用生成器实例，避免重复初始化

## 📥 安装

在 VS Code 扩展市场搜索 **"Git Commit Message Generator"** 安装，或通过 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=hungtcs.vscode-git-commit-message-generator) 安装。

> **前置条件**：需要安装 [VS Code 内置 Git 扩展](https://code.visualstudio.com/docs/sourcecontrol/overview)。

## 🔧 配置

安装后，配置你的 DeepSeek API Key：

| 配置项                                                | 类型     | 默认值       | 说明                                                         |
| ----------------------------------------------------- | -------- | ------------ | ------------------------------------------------------------ |
| `git-commit-message-generator.deepseekApiKey`         | `string` | `""`         | DeepSeek API Key                                             |
| `git-commit-message-generator.provider`               | `string` | `"deepseek"` | AI 服务提供商（当前仅支持 DeepSeek）                         |
| `git-commit-message-generator.customInstructions`     | `string` | `""`         | 自定义用户 Prompt，会附加到系统提示词之后                    |
| `git-commit-message-generator.customInstructionsFile` | `string` | `""`         | 自定义 Prompt 文件路径，支持绝对路径或相对于仓库根目录的路径 |

### 获取 DeepSeek API Key

前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并获取 API Key。

### 配置示例

在 VS Code `settings.json` 中添加：

```json
{
  "git-commit-message-generator.deepseekApiKey": "sk-xxxxxxxxxxxxxxxx",
  "git-commit-message-generator.customInstructions": "请使用中文生成提交信息，并遵循 Conventional Commits 规范。",
  "git-commit-message-generator.customInstructionsFile": ".github/commit-prompt.md"
}
```

## 🚀 使用方式

1. 在 VS Code 中对文件进行修改，并使用 Git 暂存（stage）你希望提交的变更
2. 在 SCM 面板的标题栏，点击 ✨ **「生成提交信息」** 按钮
3. 等待 AI 分析变更内容并生成提交信息
4. 生成的 Message 会自动填充到 Git 输入框中，你可以直接提交或按需修改

## 📝 工作原理

1. 读取 Git 暂存区（staged）的文件列表、变更统计和 diff 内容
2. 将变更信息与系统 Prompt 组合，发送至 DeepSeek 大模型
3. AI 分析代码变更上下文，生成符合规范的 Commit Message
4. 生成的提交信息自动写入 SCM 输入框

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/hungtcs/git-commit-message-generator.git
cd git-commit-message-generator/vscode-extension

# 安装依赖
npm install

# 编译
npm run build

# 在 VS Code 中调试：按 F5 启动扩展开发宿主
```

## 📄 License

[MIT](LICENSE)
