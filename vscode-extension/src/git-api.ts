import * as vscode from "vscode";
import type { API, GitExtension, Repository } from "./git.d.ts";

export async function getGitAPI(): Promise<API | null> {
  const extension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!extension) {
    vscode.window.showErrorMessage("未找到内置 Git 扩展");
    return null;
  }

  const gitExtension = extension.isActive ? extension.exports : await extension.activate();
  return gitExtension.getAPI(1);
}

export function getSourceControlRootUri(sourceControl: unknown): vscode.Uri | null {
  if (!sourceControl || typeof sourceControl !== "object" || !("rootUri" in sourceControl)) {
    return null;
  }

  const rootUri = sourceControl.rootUri;
  return rootUri instanceof vscode.Uri ? rootUri : null;
}

export async function getGitRepository(sourceControl?: unknown): Promise<Repository | null> {
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

export function getRepoRoot(repository: Repository | null): string | null {
  return repository?.rootUri.fsPath ?? null;
}
