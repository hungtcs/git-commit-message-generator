import assert from "node:assert/strict";
import test from "node:test";
import { Git } from "./git.js";

test("git status", async () => {
  const git = new Git(process.cwd());

  const { staged, deleted } = await git.git.status();

  const stageDeleted = deleted.filter((file) => staged.includes(file));

  console.log({
    staged: staged,
    deleted: stageDeleted,
  });
});

test("git diff 传入不存在的文件时不应抛出异常", async () => {
  const git = new Git(process.cwd());

  try {
    // 传入一个不存在的文件路径，与真实文件混合
    const diff = await git.git.diff(["--staged", "--", "nonexistent-file-12345.xyz"]);

    // 能执行到这里说明没抛异常
    assert.ok(typeof diff === "string");
    console.log("diff 成功返回，未因不存在的文件而崩溃");
  } finally {
    // 还原暂存状态
    await git.git.reset(["--", "README.md"]);
  }
});
