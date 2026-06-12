import { GitCommitMessageGenerator } from "@cicara/git-commit-message-generator";
import { anthropic } from "@genkit-ai/anthropic";
import { compatOaiModelRef, openAICompatible } from "@genkit-ai/compat-oai";
import { deepSeek } from "@genkit-ai/compat-oai/deepseek";
import { ollama } from "genkitx-ollama";
import type { Disposable } from "vscode";
import { getBaseURL, getModel, getProvider } from "./config.ts";
import { log } from "./logger.ts";

let instance: GitCommitMessageGenerator | null = null;
let instanceRepoRoot: string | null = null;
let instanceFingerprint: string | null = null;

function getConfigFingerprint(): string {
  const provider = getProvider();
  return `${provider}|${getModel(provider) ?? ""}|${getBaseURL()}`;
}

function buildProviderModel(apiKey?: string) {
  const provider = getProvider();
  const modelName = getModel(provider)!; // validated by commands.ts before reaching here

  switch (provider) {
    case "deepseek": {
      log(`[Generator] 使用 DeepSeek 模式，model=${modelName}`);
      return {
        provider: deepSeek({ apiKey: apiKey! }),
        model: deepSeek.model(modelName),
      };
    }
    case "openai-compatible": {
      const baseURL = getBaseURL();
      log(`[Generator] 使用 openai-compatible 模式，baseURL=${baseURL || "(default)"}，model=${modelName}`);
      return {
        provider: openAICompatible({
          name: "openai-compatible",
          apiKey: apiKey!,
          baseURL: baseURL || undefined,
        }),
        model: compatOaiModelRef({ name: modelName }),
      };
    }
    case "ollama": {
      const serverAddress = getBaseURL() || "http://127.0.0.1:11434";
      log(`[Generator] 使用 Ollama 模式，serverAddress=${serverAddress}，model=${modelName}`);
      return {
        provider: ollama({
          models: [{ name: modelName }],
          serverAddress,
        }),
        model: ollama.model(modelName),
      };
    }
    case "anthropic": {
      log(`[Generator] 使用 Anthropic 模式，model=${modelName}`);
      return {
        provider: anthropic({ apiKey: apiKey! }),
        model: anthropic.model(modelName),
      };
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function createInstance(apiKey: string | undefined, repoRoot: string): GitCommitMessageGenerator {
  const { provider, model } = buildProviderModel(apiKey);
  log(`[Generator] 创建新实例 (repoRoot: ${repoRoot})`);
  return new GitCommitMessageGenerator(repoRoot, provider, model, {
    logger: (message) => log(message),
  });
}

export function getGenerator(apiKey: string | undefined, repoRoot: string): GitCommitMessageGenerator {
  const fingerprint = getConfigFingerprint();
  if (!instance || instanceRepoRoot !== repoRoot || instanceFingerprint !== fingerprint) {
    instance = createInstance(apiKey, repoRoot);
    instanceRepoRoot = repoRoot;
    instanceFingerprint = fingerprint;
  }
  return instance;
}

export function invalidateGenerator(): void {
  if (instance) {
    log("[Generator] 实例已作废");
    instance = null;
    instanceRepoRoot = null;
    instanceFingerprint = null;
  }
}

export function watchProviderChanges(
  onDidChangeConfiguration: typeof import("vscode").workspace.onDidChangeConfiguration,
): Disposable {
  return onDidChangeConfiguration((e) => {
    if (
      e.affectsConfiguration("git-commit-message-generator.provider") ||
      e.affectsConfiguration("git-commit-message-generator.model") ||
      e.affectsConfiguration("git-commit-message-generator.baseURL")
    ) {
      invalidateGenerator();
    }
  });
}
