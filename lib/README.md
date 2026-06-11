# @cicara/git-commit-message-generator

AI-powered Git commit message generation library. Built on [Genkit](https://firebase.google.com/docs/genkit) and [simple-git](https://github.com/steveukx/git-js), it provides Git-aware tools for AI models to analyze staged changes and produce meaningful commit messages.

## Features

- 🤖 **AI-native**: Built on Genkit, works with any supported model provider
- 🔧 **Git tools**: Provides structured tools (`git-staged-files`, `git-staged-files-stat`, `git-staged-files-diff`) for AI models
- 📐 **Schema-validated output**: Commit messages validated via Zod schema
- 🧩 **Pluggable**: Bring your own Genkit plugin and model
- 📊 **Optional logging**: Built-in logger for debugging and observability

## Installation

```bash
npm install @cicara/git-commit-message-generator genkit
```

You'll also need a Genkit model provider plugin, e.g.:

```bash
npm install @genkit-ai/compat-oai
```

## Usage

```ts
import { GitCommitMessageGenerator } from "@cicara/git-commit-message-generator";
import { deepSeek } from "@genkit-ai/compat-oai/deepseek";

const generator = new GitCommitMessageGenerator(
  "/path/to/git/repo", // baseDir
  deepSeek({ apiKey: "sk-..." }), // provider plugin
  deepSeek.model("deepseek-v4-flash"), // model
  {
    logger: (msg) => console.log(msg), // optional
  },
);

const result = await generator.generateCommitMessage("Use conventional commits format");

if (result) {
  console.log(result.message); // the commit message
  console.log(result.summary); // explanation of why this message was chosen
}
```

## How It Works

The library guides the AI model through a 4-step workflow:

1. **List staged files** — calls `git-staged-files` to get staged and deleted files
2. **Get change statistics** — calls `git-staged-files-stat` for an overview of insertions/deletions
3. **Selective diff** — calls `git-staged-files-diff` on relevant files (skipping lock files, build artifacts, binaries, etc.)
4. **Generate message** — produces a structured commit message with a summary explanation

## API

### `new GitCommitMessageGenerator(baseDir, provider, model, options?)`

| Param            | Type                    | Description                                                  |
| ---------------- | ----------------------- | ------------------------------------------------------------ |
| `baseDir`        | `string`                | Path to the Git repository root                              |
| `provider`       | `GenkitPlugin`          | Genkit-compatible model provider plugin                      |
| `model`          | `ModelArgument`         | Model instance (e.g., `deepSeek.model("deepseek-v4-flash")`) |
| `options.logger` | `(msg: string) => void` | Optional log callback                                        |

### `generator.generateCommitMessage(prompt?)`

| Param    | Type     | Description                                               |
| -------- | -------- | --------------------------------------------------------- |
| `prompt` | `string` | Optional custom user prompt appended to the system prompt |

Returns `Promise<{ message: string; summary: string } | null>`.

## License

[MIT](LICENSE)
