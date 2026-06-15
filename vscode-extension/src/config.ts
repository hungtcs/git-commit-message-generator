import path from "node:path";
import * as vscode from "vscode";
import { log } from "./logger.ts";

const CONFIG_SECTION = "git-commit-message-generator";

export function getProvider(): string {
  return vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>("provider", "deepseek");
}

/**
 * Returns the configured model name. Only applies the default ("deepseek-v4-flash")
 * when provider is "deepseek" and no model is explicitly set. Returns undefined
 * for other providers when the model is unset — the caller should prompt the user.
 */
export function getModel(provider: string): string | undefined {
  const raw = vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>("model");
  if (raw) return raw;
  if (provider === "deepseek") return "deepseek-v4-flash";
  return undefined;
}

export function getBaseURL(): string {
  return vscode.workspace.getConfiguration(CONFIG_SECTION).get<string>("baseURL", "").trim();
}

export async function loadCustomPrompt(repoRoot: string): Promise<string> {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  const prompts: string[] = [];

  const inlineText = config.get<string>("customInstructions", "").trim();
  if (inlineText) {
    log(`已加载 settings 自定义 prompt，长度=${inlineText.length}`);
    prompts.push(inlineText);
  }

  const filePath = config.get<string>("customInstructionsFile", "").trim();
  if (filePath) {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(repoRoot, filePath);
    log(`正在读取自定义 prompt 文件：${absolutePath}`);
    const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(absolutePath));
    const content = new TextDecoder().decode(raw).trim();

    if (content) {
      log(`已加载文件自定义 prompt，长度=${content.length}`);
      prompts.push(content);
    } else {
      log("自定义 prompt 文件为空，已跳过");
    }
  }

  return prompts.join("\n\n");
}

export async function getApiKey(secrets: vscode.SecretStorage): Promise<string | undefined> {
  log("正在从 SecretStorage 读取 API Key");
  return secrets.get("deepseekApiKey");
}

export async function storeApiKey(secrets: vscode.SecretStorage, key: string): Promise<void> {
  await secrets.store("deepseekApiKey", key);
  log("API Key 已更新");
}
