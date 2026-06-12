# Cicara Git Commit Message Generator

[![VS Code](https://img.shields.io/badge/VS%20Code-^1.120.0-blue?logo=visual-studio-code)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

基于 AI 自动生成 Git 提交信息的 VS Code 扩展。通过分析 **已暂存的变更（staged changes）**，结合大语言模型，智能生成高质量的 Git Commit Message，帮助你写出规范、清晰的提交记录。

## ✨ 功能特性

- 🤖 **AI 驱动**：支持多种 AI 服务提供商（DeepSeek、OpenAI 兼容、Ollama、Anthropic），理解代码变更上下文，生成有意义的提交信息
- 🖱️ **一键生成**：在 SCM（源代码管理）面板的标题栏点击 ✨ 按钮即可生成
- 📋 **自动填充**：生成的提交信息会自动填入 Git 输入框，可直接提交或修改
- 🔐 **安全存储**：API Key 使用 VS Code SecretStorage 加密存储，不暴露在配置文件中
- ✏️ **自定义 Prompt**：支持在 VS Code 设置中配置自定义提示词，或指定外部 prompt 文件
- 📊 **详细日志**：内置输出通道，可查看 AI 调用过程和分析结果
- ⚡ **缓存优化**：同一仓库复用生成器实例，避免重复初始化

## 📥 安装

在 VS Code 扩展市场搜索 **"Cicara Git Commit Message Generator"** 安装，或通过 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=hungtcs.cicara-vscode-git-commit-message-generator) 安装。

> **前置条件**：需要安装 [VS Code 内置 Git 扩展](https://code.visualstudio.com/docs/sourcecontrol/overview)。

## 🔧 配置

### 设置 API Key

首次使用时，通过命令面板（`Cmd+Shift+P`）运行 **「设置 API Key」** 命令，输入你的 API Key。Key 会安全存储在 VS Code 的 SecretStorage 中。

> **注意**：Ollama 本地部署模式无需 API Key，可直接使用。

### 配置项

| 配置项                                                | 类型     | 默认值                | 说明                                                                                                                           |
| ----------------------------------------------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `git-commit-message-generator.provider`               | `string` | `"deepseek"`          | AI 服务提供商，可选 `deepseek` / `openai-compatible` / `ollama` / `anthropic`                                                  |
| `git-commit-message-generator.model`                  | `string` | `"deepseek-v4-flash"` | 模型名称。DeepSeek 模式下默认为 `deepseek-v4-flash`；其他模式下需手动指定目标模型                                              |
| `git-commit-message-generator.baseURL`                | `string` | `""`                  | API 基础地址。openai-compatible 模式下为 OpenAI 兼容端点；ollama 模式下为 Ollama 服务地址（留空默认 `http://127.0.0.1:11434`） |
| `git-commit-message-generator.customInstructions`     | `string` | `""`                  | 自定义用户 Prompt，会替换默认用户提示词                                                                                        |
| `git-commit-message-generator.customInstructionsFile` | `string` | `""`                  | 自定义 Prompt 文件路径，支持绝对路径或相对于仓库根目录的路径                                                                   |

### 配置示例

```jsonc
{
  "git-commit-message-generator.provider": "deepseek",
  "git-commit-message-generator.model": "deepseek-v4-flash",
  // "git-commit-message-generator.customInstructions": "请使用中文生成提交信息，并遵循 Conventional Commits 规范。",
  "git-commit-message-generator.customInstructionsFile": ".github/commit-prompt.md",
}
```

使用 OpenAI 兼容服务（如本地部署的 vLLM）：

```json
{
  "git-commit-message-generator.provider": "openai-compatible",
  "git-commit-message-generator.model": "qwen2.5-coder-7b",
  "git-commit-message-generator.baseURL": "http://localhost:8000/v1"
}
```

使用 Ollama 本地模型：

```json
{
  "git-commit-message-generator.provider": "ollama",
  "git-commit-message-generator.model": "qwen2.5-coder:7b"
}
```

## 🚀 使用方式

1. 在 VS Code 中对文件进行修改，并使用 Git 暂存（stage）你希望提交的变更
2. 设置 API Key：通过命令面板运行 **「设置 API Key」** 命令（Ollama 模式下可跳过）
3. 在 SCM 面板的标题栏，点击 ✨ **「生成提交信息」** 按钮
4. 等待 AI 分析变更内容并生成提交信息
5. 生成的 Message 会自动填充到 Git 输入框中，你可以直接提交或按需修改

## 📝 工作原理

1. 读取 Git 暂存区（staged）的文件列表、变更统计和 diff 内容
2. 将变更信息与系统 Prompt 组合，发送至配置的 AI 模型
3. AI 分析代码变更上下文，生成符合规范的 Commit Message
4. 生成的提交信息自动写入 SCM 输入框

## 🛠️ 开发

```bash
# 安装 vsce 打包工具
npm install -g @vscode/vsce

# 克隆仓库
git clone https://github.com/hungtcs/git-commit-message-generator.git
cd git-commit-message-generator/vscode-extension

# 安装依赖
npm install

# 编译
npm run build

# 打包
npm run pack

# 在 VS Code 中调试：按 F5 启动扩展开发宿主
```
