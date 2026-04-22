import fs from "fs";
import path from "path";

export const GENERATE_TEMPLATE_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "ai-docs/prompts/generate-template.md"),
  "utf-8"
);
