import { deepSeek } from "@genkit-ai/compat-oai/deepseek";
import { loadEnvFile } from "node:process";
import test from "node:test";
import { GitCommitMessageGenerator } from "./index.js";

loadEnvFile();

test("generate commit message", async () => {
  const provider = deepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
  const model = deepSeek.model("deepseek-v4-flash");
  const generator = new GitCommitMessageGenerator(process.cwd(), provider, model);

  const result = await generator.generateCommitMessage();
  console.log(result);
});
