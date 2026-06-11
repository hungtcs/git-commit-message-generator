import * as vscode from "vscode";
import { getCustomPrompt, getGenerator, setLogger, watchConfigChanges } from "./generate.ts";
import type { API, GitExtension, Repository } from "./git.d.ts";

function formatError(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

function log(channel: vscode.OutputChannel, message: string): void {
  channel.appendLine(`[${new Date().toISOString()}] ${message}`);
}

async function getGitAPI(): Promise<API | null> {
  const extension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!extension) {
    vscode.window.showErrorMessage("The built-in Git extension could not be found.");
    return null;
  }

  const gitExtension = extension.isActive ? extension.exports : await extension.activate();
  return gitExtension.getAPI(1);
}

function getSourceControlRootUri(sourceControl: unknown): vscode.Uri | null {
  if (!sourceControl || typeof sourceControl !== "object" || !("rootUri" in sourceControl)) {
    return null;
  }

  const rootUri = sourceControl.rootUri;
  return rootUri instanceof vscode.Uri ? rootUri : null;
}

async function getGitRepository(sourceControl?: unknown): Promise<Repository | null> {
  const gitAPI = await getGitAPI();
  if (!gitAPI) {
    return null;
  }
  const repositories = gitAPI.repositories;
  if (!repositories || repositories.length === 0) {
    vscode.window.showErrorMessage("未找到 Git 仓库");
    return null;
  }

  const sourceControlRootUri = getSourceControlRootUri(sourceControl);
  if (sourceControlRootUri) {
    const repository =
      gitAPI.getRepository(sourceControlRootUri) ??
      repositories.find((item) => item.rootUri.fsPath === sourceControlRootUri.fsPath);

    if (repository) {
      return repository;
    }
  }

  return repositories.find((item) => item.ui.selected) ?? repositories[0] ?? null;
}

function getGitRepoRoot(repository: Repository | null): string | null {
  return repository?.rootUri.fsPath ?? null;
}

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel("Git Commit Message Generator");
  setLogger(channel);
  context.subscriptions.push(channel);

  log(channel, "Git Commit Message Generator 扩展已激活");

  // 监听配置变化，自动作废旧实例
  context.subscriptions.push(watchConfigChanges());

  // 注册设置 API Key 命令
  const setApiKeyDisposable = vscode.commands.registerCommand("git-commit-message-generator.setApiKey", async () => {
    const key = await vscode.window.showInputBox({
      prompt: "请输入 DeepSeek API Key",
      password: true,
      ignoreFocusOut: true,
      placeHolder: "sk-...",
    });

    if (key) {
      await context.secrets.store("deepseekApiKey", key);
      vscode.window.showInformationMessage("DeepSeek API Key 已安全保存");
      log(channel, "API Key 已更新");
    }
  });
  context.subscriptions.push(setApiKeyDisposable);

  const generateDisposable = vscode.commands.registerCommand(
    "git-commit-message-generator.generate",
    async (sourceControl) => {
      const startedAt = Date.now();
      const config = vscode.workspace.getConfiguration("git-commit-message-generator");
      const provider = config.get<string>("provider", "deepseek");

      channel.show(true);
      log(channel, "收到生成提交信息命令");
      log(channel, `命令参数 SourceControl.rootUri=${getSourceControlRootUri(sourceControl)?.fsPath ?? "(none)"}`);

      log(channel, "从 SecretStorage 读取 API Key");
      const deepseekApiKey = await context.secrets.get("deepseekApiKey");
      log(channel, `配置读取完成，provider=${provider}，hasDeepSeekApiKey=${!!deepseekApiKey}`);

      if (!deepseekApiKey) {
        log(channel, "终止：未配置 DeepSeek API Key");
        const setKey = await vscode.window.showWarningMessage("请先设置 DeepSeek API Key", "设置 API Key");
        if (setKey) {
          vscode.commands.executeCommand("git-commit-message-generator.setApiKey");
        }
        return;
      }

      log(channel, "开始解析 Git 仓库");
      const repo = await getGitRepository(sourceControl);
      const repoRoot = getGitRepoRoot(repo);
      if (!repoRoot) {
        log(channel, "终止：未找到 Git 仓库");
        vscode.window.showErrorMessage("未找到 Git 仓库");
        return;
      }
      log(channel, `Git 仓库解析完成，repoRoot=${repoRoot}`);

      log(channel, "开始加载自定义用户 prompt");
      let customPrompt = "";
      try {
        customPrompt = await getCustomPrompt(repoRoot);
      } catch (error) {
        log(channel, `加载自定义用户 prompt 失败：${formatError(error)}`);
        vscode.window.showErrorMessage(
          `加载自定义用户 prompt 失败：${error instanceof Error ? error.message : String(error)}`,
        );
        return;
      }
      log(channel, `自定义用户 prompt 加载完成，长度=${customPrompt.length}`);

      log(channel, "开始创建或复用提交信息生成器");
      const generator = getGenerator(deepseekApiKey, repoRoot);
      log(channel, "提交信息生成器准备完成");

      try {
        log(channel, "开始调用 AI 生成提交信息");
        const result = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `正在使用 ${provider} 生成提交信息...`,
            cancellable: false,
          },
          async () => generator.generateCommitMessage(customPrompt),
        );

        log(channel, `AI 调用结束，总耗时 ${Date.now() - startedAt}ms，hasResult=${result !== null}`);
        if (result) {
          log(channel, `准备写入 SCM 输入框，message=${result.message}`);
          // 将生成的提交信息填入触发命令的 Git 仓库输入框
          if (repo) {
            repo.inputBox.value = result.message;
            log(channel, "SCM 输入框写入完成");
          }
          vscode.window.showInformationMessage(result.summary);
          log(channel, `完成：${result.summary}`);
        } else {
          log(channel, "AI 返回空结果，未写入 SCM 输入框");
          vscode.window.showWarningMessage("未生成提交信息，请查看输出通道日志");
        }
      } catch (error) {
        log(channel, `生成流程失败，总耗时 ${Date.now() - startedAt}ms`);
        log(channel, formatError(error));
        vscode.window.showErrorMessage(`生成提交信息失败：${error instanceof Error ? error.message : String(error)}`);
      }
    },
  );

  context.subscriptions.push(generateDisposable);
}
