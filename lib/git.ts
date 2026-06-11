import { Genkit, z } from "genkit";
import { simpleGit } from "simple-git";

const git = simpleGit();

export async function gitStagedDiff(files: string[]) {
  return await git.diff(["--staged", ...files]);
}

export function getGitStagedFilesTool(ai: Genkit) {
  return ai.defineTool(
    {
      name: "git-staged-files",
      description: "get git staged files, return the list of staged files.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        files: z.array(z.string()),
      }),
    },
    async (input) => {
      const status = await git.status();
      return {
        files: status.staged,
      };
    },
  );
}

export function getGitStagedFilesStatTool(ai: Genkit) {
  return ai.defineTool(
    {
      name: "git-staged-files-stat",
      description: "查看暂存区文件的统计信息，包括新增、修改、删除的文件数和行数",
      inputSchema: z.object({}),
      outputSchema: z.object({
        stat: z.string(),
      }),
    },
    async () => {
      const stat = await git.diff(["--staged", "--stat"]);
      return {
        stat: stat,
      };
    },
  );
}

export function getGitStagedFilesDiffTool(ai: Genkit) {
  return ai.defineTool(
    {
      name: "git-staged-files-diff",
      description: "查看指定暂存区文件的差异详细信息",
      inputSchema: z.object({
        files: z.array(z.string()).describe("要查看的文件列表"),
      }),
      outputSchema: z.object({
        diff: z.string(),
      }),
    },
    async (input) => {
      const diff = await git.diff(["--staged", ...input.files]);
      return {
        diff: diff,
      };
    },
  );
}
