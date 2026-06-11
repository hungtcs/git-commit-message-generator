import { Genkit, z } from "genkit";
import { simpleGit, type SimpleGit } from "simple-git";

export type Logger = (message: string) => void;

export class Git {
  public git: SimpleGit;
  private logger: Logger | undefined;

  constructor(baseDir?: string, logger?: Logger) {
    this.git = simpleGit(baseDir);
    this.logger = logger;
  }

  private log(message: string): void {
    this.logger?.(`[Git] ${message}`);
  }

  public getGitStagedFilesTool(ai: Genkit) {
    return ai.defineTool(
      {
        name: "git-staged-files",
        description: "get git staged files, return the list of staged files.",
        inputSchema: z.object({}),
        outputSchema: z.object({
          staged: z.array(z.string()),
          deleted: z.array(z.string()),
        }),
      },
      async (input) => {
        const startedAt = Date.now();
        this.log("git-staged-files 开始执行");
        const status = await this.git.status();
        this.log(
          `git-staged-files 执行完成，耗时 ${Date.now() - startedAt}ms，staged=${status.staged.length}，deleted=${status.deleted.length}`,
        );
        return {
          staged: status.staged,
          deleted: status.deleted,
        };
      },
    );
  }

  public getGitStagedFilesStatTool(ai: Genkit) {
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
        const startedAt = Date.now();
        this.log("git-staged-files-stat 开始执行");
        const stat = await this.git.diff(["--staged", "--stat"]);
        this.log(
          `git-staged-files-stat 执行完成，耗时 ${Date.now() - startedAt}ms，长度=${stat.length}`,
        );
        return {
          stat: stat,
        };
      },
    );
  }

  public getGitStagedFilesDiffTool(ai: Genkit) {
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
        const startedAt = Date.now();
        this.log(`git-staged-files-diff 开始执行，files=${input.files.join(", ") || "(empty)"}`);
        const diff = await this.git.diff(["--staged", ...input.files]);
        this.log(
          `git-staged-files-diff 执行完成，耗时 ${Date.now() - startedAt}ms，长度=${diff.length}`,
        );
        return {
          diff: diff,
        };
      },
    );
  }
}
