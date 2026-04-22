import fs from "fs";
import path from "path";

export const GENERATE_HISTORY_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "ai-docs/prompts/generate-history.md"),
  "utf-8"
);
