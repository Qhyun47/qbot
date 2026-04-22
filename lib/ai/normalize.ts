import { loadSchema } from "@/lib/ai/load-resources";
import { generateStructured } from "@/lib/ai/gemini-client";
import { NORMALIZE_SYSTEM_PROMPT } from "@/lib/ai/prompts/normalize";
import type { StructuredCase } from "@/lib/ai/types";

export async function normalizeInputs(
  cc: string,
  inputs: Array<{
    rawText: string;
    timeTag: string | null;
    timeOffsetMinutes: number | null;
  }>,
  templateKey?: string | null
): Promise<StructuredCase> {
  const schemaKey = templateKey ?? "_generic";

  const schema = loadSchema(schemaKey);
  const userPrompt = JSON.stringify({ cc, inputs }, null, 2);

  return generateStructured<StructuredCase>(
    userPrompt,
    NORMALIZE_SYSTEM_PROMPT,
    schema,
    8192
  );
}
