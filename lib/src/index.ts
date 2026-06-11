import { Genkit, genkit, type ModelArgument, type ToolAction, z } from "genkit";
import { type GenkitPlugin, type GenkitPluginV2 } from "genkit/plugin";
import { Git, type Logger } from "./git.ts";
import { loggerMiddleware } from "./log.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";

const CommitMessageSchema = z
  .object({
    message: z.string().describe("the git commit message"),
    summary: z
      .string()
      .describe("a brief explanation shown to the user, describing why this commit message was chosen"),
  })
  .nullable();

export class GitCommitMessageGenerator {
  public ai: Genkit;
  public gitStagedFilesTool: ToolAction;
  public gitStagedDiffTool: ToolAction;
  public gitStagedFilesStatTool: ToolAction;
  private logger: Logger | undefined;

  constructor(
    baseDir: string,
    provider: GenkitPlugin | GenkitPluginV2,
    model: ModelArgument<any>,
    options?: { logger?: Logger },
  ) {
    this.logger = options?.logger;
    this.log(`初始化生成器，baseDir=${baseDir}`);

    const git = new Git(baseDir, this.logger);

    this.ai = genkit({
      plugins: [provider],
      model: model,
    });
    this.gitStagedFilesTool = git.getGitStagedFilesTool(this.ai);
    this.gitStagedFilesStatTool = git.getGitStagedFilesStatTool(this.ai);
    this.gitStagedDiffTool = git.getGitStagedFilesDiffTool(this.ai);
  }

  private log(message: string): void {
    this.logger?.(`[GitCommitMessageGenerator] ${message}`);
  }

  public async generateCommitMessage(prompt?: string) {
    const startedAt = Date.now();
    this.log(`开始生成提交信息，promptLength=${prompt?.length ?? 0}`);
    try {
      const response = await this.ai.generate({
        prompt: prompt || "请生成 Git 提交信息",
        system: SYSTEM_PROMPT,
        output: {
          schema: CommitMessageSchema,
        },
        tools: [
          this.gitStagedFilesTool, //
          this.gitStagedFilesStatTool,
          this.gitStagedDiffTool,
        ],
        use: [loggerMiddleware({ verbose: true })],
      });
      this.log(`生成完成，耗时 ${Date.now() - startedAt}ms，message=${response.output?.message ?? "(null)"}`);
      return response.output;
    } catch (error) {
      this.log(
        `生成失败，耗时 ${Date.now() - startedAt}ms，error=${error instanceof Error ? error.stack : String(error)}`,
      );
      throw error;
    }
  }
}
