import fs from "fs";
import path from "path";

export const GENERATE_PE_SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "ai-docs/prompts/generate-pe.md"),
  "utf-8"
);
