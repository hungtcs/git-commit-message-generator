import { GitCommitMessageGenerator } from "@cicara/git-commit-message-generator";
import { deepSeek } from "@genkit-ai/compat-oai/deepseek";
import path from "node:path";
import * as vscode from "vscode";

let generator: GitCommitMessageGenerator | null = null;
let currentBaseDir: string | null = null;
let log: vscode.OutputChannel | null = null;

export function setLogger(channel: vscode.OutputChannel): void {
  log = channel;
}

function createGenerator(apiKey: string, baseDir: string): GitCommitMessageGenerator {
  const provider = deepSeek({ apiKey });
  const model = deepSeek.model("deepseek-v4-flash");
  log?.appendLine(`[GitCommitMessageGenerator] 创建新实例 (baseDir: ${baseDir})`);
  return new GitCommitMessageGenerator(baseDir, provider, model, {
    logger: (message) => log?.appendLine(message),
  });
}

export function getGenerator(baseDir: string): GitCommitMessageGenerator | null {
  const config = vscode.workspace.getConfiguration("gitCommitMessageGenerator");
  const apiKey = config.get<string>("deepseekApiKey", "");
  if (!apiKey) return null;

  if (!generator || currentBaseDir !== baseDir) {
    generator = createGenerator(apiKey, baseDir);
    currentBaseDir = baseDir;
  }
  return generator;
}

export async function getCustomPrompt(baseDir: string): Promise<string> {
  const config = vscode.workspace.getConfiguration("gitCommitMessageGenerator");
  const customInstructions = config.get<string>("customInstructions", "").trim();
  const customInstructionsFile = config.get<string>("customInstructionsFile", "").trim();
  const prompts: string[] = [];

  if (customInstructions) {
    log?.appendLine(`[GitCommitMessageGenerator] 已加载 settings 自定义用户 prompt，长度=${customInstructions.length}`);
    prompts.push(customInstructions);
  }

  if (customInstructionsFile) {
    const filePath = path.isAbsolute(customInstructionsFile)
      ? customInstructionsFile
      : path.resolve(baseDir, customInstructionsFile);
    log?.appendLine(`[GitCommitMessageGenerator] 开始读取自定义用户 prompt 文件：${filePath}`);
    const content = new TextDecoder().decode(await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))).trim();

    if (content) {
      log?.appendLine(`[GitCommitMessageGenerator] 已加载文件自定义用户 prompt，长度=${content.length}`);
      prompts.push(content);
    } else {
      log?.appendLine("[GitCommitMessageGenerator] 自定义用户 prompt 文件为空，已跳过");
    }
  }

  return prompts.join("\n\n");
}

export function invalidateGenerator(): void {
  generator = null;
  currentBaseDir = null;
}

/**
 * 监听配置变化，当 provider 或 apiKey 变化时重建 generator。
 * 返回 disposable 需要 push 到 context.subscriptions。
 */
export function watchConfigChanges(): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (
      e.affectsConfiguration("gitCommitMessageGenerator.provider") ||
      e.affectsConfiguration("gitCommitMessageGenerator.deepseekApiKey")
    ) {
      log?.appendLine("[GitCommitMessageGenerator] 配置已变更，作废旧实例");
      invalidateGenerator();
    }
  });
}
