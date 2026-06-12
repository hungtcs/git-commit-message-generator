import * as vscode from "vscode";
import { initLogger, log } from "./logger.ts";
import { createSetApiKeyCommand, createGenerateCommand } from "./commands.ts";
import { watchProviderChanges } from "./generator-manager.ts";

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel("Git Commit Message Generator");
  initLogger(channel);
  context.subscriptions.push(channel);

  log("Git Commit Message Generator 扩展已激活");

  context.subscriptions.push(
    watchProviderChanges(vscode.workspace.onDidChangeConfiguration),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "git-commit-message-generator.setApiKey",
      createSetApiKeyCommand(context.secrets),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "git-commit-message-generator.generate",
      createGenerateCommand(context.secrets),
    ),
  );
}
