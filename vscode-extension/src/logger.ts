import * as vscode from "vscode";

let channel: vscode.OutputChannel | null = null;

export function initLogger(ch: vscode.OutputChannel): void {
  channel = ch;
}

export function log(message: string): void {
  if (channel) {
    channel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }
}

export function show(preserveFocus?: boolean): void {
  channel?.show(preserveFocus);
}
