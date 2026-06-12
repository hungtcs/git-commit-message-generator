import * as vscode from "vscode";
import { getApiKey, getProvider, getModel, loadCustomPrompt, storeApiKey } from "./config.ts";
import { getGenerator } from "./generator-manager.ts";
import { getGitRepository, getRepoRoot, getSourceControlRootUri } from "./git-api.ts";
import { log, show } from "./logger.ts";

function formatError(error: unknown): string {
  return error instanceof Error ? (error.stack ?? error.message) : String(error);
}

export function createSetApiKeyCommand(secrets: vscode.SecretStorage): () => Promise<void> {
  return async () => {
    const key = await vscode.window.showInputBox({
      prompt: "请输入 API Key",
      password: true,
      ignoreFocusOut: true,
      placeHolder: "sk-...",
    });
    if (key) {
      await storeApiKey(secrets, key);
      vscode.window.showInformationMessage("API Key 已安全保存");
    }
  };
}

export function createGenerateCommand(secrets: vscode.SecretStorage): (sourceControl?: unknown) => Promise<void> {
  return async (sourceControl) => {
    const startedAt = Date.now();
    const provider = getProvider();
    const modelName = getModel(provider);
    show(true);
    log("收到生成提交信息命令");
    log(`配置：provider=${provider}，model=${modelName ?? "(未设置)"}`);
    log(`SourceControl.rootUri=${getSourceControlRootUri(sourceControl)?.fsPath ?? "(none)"}`);

    if (!modelName) {
      log("终止：未配置模型名称");
      const openSettings = await vscode.window.showWarningMessage(
        `使用 ${provider} 模式需要先配置模型名称`,
        "打开设置",
      );
      if (openSettings) {
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "git-commit-message-generator.model",
        );
      }
      return;
    }

    const apiKey = await getApiKey(secrets);
    log(`hasApiKey=${!!apiKey}`);

    // Ollama can run without auth locally, but supports api-key header for remote deployments
    if (!apiKey && provider !== "ollama") {
      log("终止：未配置 API Key");
      const setKey = await vscode.window.showWarningMessage("请先设置 API Key", "设置 API Key");
      if (setKey) {
        vscode.commands.executeCommand("git-commit-message-generator.setApiKey");
      }
      return;
    }

    log("开始解析 Git 仓库");
    const repo = await getGitRepository(sourceControl);
    const repoRoot = getRepoRoot(repo);
    if (!repoRoot) {
      log("终止：未找到 Git 仓库");
      vscode.window.showErrorMessage("未找到 Git 仓库");
      return;
    }
    log(`Git 仓库解析完成，repoRoot=${repoRoot}`);

    log("开始加载自定义 prompt");
    let customPrompt: string;
    try {
      customPrompt = await loadCustomPrompt(repoRoot);
    } catch (error) {
      log(`加载自定义 prompt 失败：${formatError(error)}`);
      vscode.window.showErrorMessage(
        `加载自定义 prompt 失败：${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
    log(`自定义 prompt 加载完成，长度=${customPrompt.length}`);

    const generator = getGenerator(apiKey, repoRoot);

    try {
      log("开始调用 AI 生成提交信息");
      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `正在使用 ${modelName} 生成提交信息...`,
          cancellable: false,
        },
        async () => generator.generateCommitMessage(customPrompt),
      );

      const elapsed = Date.now() - startedAt;
      log(`AI 调用结束，耗时 ${elapsed}ms，hasResult=${result !== null}`);
      if (result) {
        log(`准备写入 SCM 输入框，message=${result.message}`);
        if (repo) {
          repo.inputBox.value = result.message;
          log("SCM 输入框写入完成");
        }
        vscode.window.showInformationMessage(result.summary);
        log(`完成：${result.summary}`);
      } else {
        log("AI 返回空结果，未写入 SCM 输入框");
        vscode.window.showWarningMessage("未生成提交信息，请查看输出通道日志");
      }
    } catch (error) {
      log(`生成流程失败，总耗时 ${Date.now() - startedAt}ms`);
      log(formatError(error));
      vscode.window.showErrorMessage(`生成提交信息失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
