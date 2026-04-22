import fs from "fs";
import path from "path";

export const GENERATE_PI_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "ai-docs/prompts/generate-pi.md"),
  "utf-8"
);
