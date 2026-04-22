import fs from "fs";
import path from "path";

export const NORMALIZE_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "ai-docs/prompts/normalize.md"),
  "utf-8"
);
