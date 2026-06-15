import * as vscode from "vscode";
import { createGenerateCommand, createSetApiKeyCommand } from "./commands.ts";
import { watchProviderChanges } from "./generator-manager.ts";
import { initLogger, log } from "./logger.ts";

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel("Git Commit Message Generator");
  initLogger(channel);
  context.subscriptions.push(channel);

  log("Git Commit Message Generator 扩展已激活");

  context.subscriptions.push(watchProviderChanges(vscode.workspace.onDidChangeConfiguration));

  context.subscriptions.push(
    vscode.commands.registerCommand("git-commit-message-generator.setApiKey", createSetApiKeyCommand(context.secrets)),
  );

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "git-commit-message-generator.generate",
      createGenerateCommand(context.secrets, statusBarItem),
    ),
  );
}
