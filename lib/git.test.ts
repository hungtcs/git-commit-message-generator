import test from "node:test";
import { Git } from "./git.ts";

test("git status", async () => {
  const git = new Git(process.cwd());

  const { staged, deleted } = await git.git.status();

  const stageDeleted = deleted.filter((file) => staged.includes(file));

  console.log({
    staged: staged,
    deleted: stageDeleted,
  });
});
