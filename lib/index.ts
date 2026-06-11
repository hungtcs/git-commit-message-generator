import { Genkit, genkit, type ModelArgument, type ToolAction, z } from "genkit";
import { type GenkitPlugin, type GenkitPluginV2 } from "genkit/plugin";
import { getGitStagedFilesDiffTool, getGitStagedFilesStatTool } from "./git.ts";
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
  // public gitStagedFilesTool: ToolAction;
  public gitStagedDiffTool: ToolAction;
  public gitStagedFilesStatTool: ToolAction;

  constructor(provider: GenkitPlugin | GenkitPluginV2, model: ModelArgument<any>) {
    this.ai = genkit({
      plugins: [provider],
      model: model,
    });
    // this.gitStagedFilesTool = getGitStagedFilesTool(this.ai);
    this.gitStagedFilesStatTool = getGitStagedFilesStatTool(this.ai);
    this.gitStagedDiffTool = getGitStagedFilesDiffTool(this.ai);
  }

  public async generateCommitMessage(prompt?: string) {
    const response = await this.ai.generate({
      prompt: prompt || "请生成 Git 提交信息",
      system: SYSTEM_PROMPT,
      output: {
        schema: CommitMessageSchema,
      },
      tools: [
        this.gitStagedFilesStatTool, //
        this.gitStagedDiffTool,
        // this.gitStagedFilesTool,
      ],
      use: [loggerMiddleware({ verbose: true })],
    });
    return response.output;
  }
}
