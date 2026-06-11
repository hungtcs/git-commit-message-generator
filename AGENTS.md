# AGENTS.md

基于 Genkit + DeepSeek 的 AI Git 提交信息自动生成工具。

## 构建与测试

```bash
pnpm build          # tsc 编译
node --experimental-strip-types --test lib/*.test.ts   # 运行测试
```

## 架构

```
cli/index.ts       → CLI 入口（开发中）
lib/git.ts         → Git 操作（simple-git）+ Genkit tool 定义
lib/llm.ts         → Genkit 配置（DeepSeek V4 Flash）、提交信息生成逻辑
lib/index.ts       → （未使用，空文件）
```

- 使用 [Genkit](https://firebase.google.com/docs/genkit) 搭配 `@genkit-ai/compat-oai` 实现对 DeepSeek 的兼容。
- LLM 被赋予两个 tool（`get-git-staged-files`、`get-git-staged-diff`），使其在生成提交信息前能读取当前 Git 状态。
- 输出结构：`{ message, summary }`，其中 `message` 为提交信息，`summary` 解释选择该信息的原因。

## 约定

### 提交信息

- **使用中文编写**，遵循 AngularJS 风格：`type(scope): subject`
- 类型：feat、fix、docs、style、refactor、perf、test、chore
- 适当使用 emoji 增强视觉效果（🎯 重构、✨ 新功能、🐛 修复、📝 文档、🚀 性能、♻️ 代码改进）
- 示例：`refactor(模态框): 改进对话框状态管理 🎯`

### 代码风格

- TypeScript ESM（`"type": "module"`，`module: "nodenext"`）
- 启用 strict 模式；import 需要 `.ts` 扩展名（由 `rewriteRelativeImportExtensions` 处理）
- 测试使用 Node.js 内置 `node:test` 运行器，与源码同目录（`lib/*.test.ts`）

## 注意事项

- DeepSeek API key 硬编码在 `lib/llm.ts` 中——请勿提交真实 key。
- `pnpm-workspace.yaml` 中配置了 `allowBuilds`，用于 Genkit 依赖的 firebase/protobuf 原生模块。
