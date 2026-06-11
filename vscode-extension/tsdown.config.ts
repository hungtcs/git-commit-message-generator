import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/extension.ts",
  platform: "node",
  outDir: "./dist",
  dts: false,
  minify: true,
  deps: {
    neverBundle: "vscode",
    alwaysBundle: [/./],
  },
  format: ["cjs"],
});
