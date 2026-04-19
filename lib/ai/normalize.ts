import ccListJson from "@/lib/ai/resources/cc-list.json";
import { loadSchema } from "@/lib/ai/load-resources";
import { generateStructured } from "@/lib/ai/gemini-client";
import { NORMALIZE_SYSTEM_PROMPT } from "@/lib/ai/prompts/normalize";
import type { StructuredCase } from "@/lib/ai/types";

interface CcListEntry {
  cc: string;
  hasTemplate: boolean;
  templateKey: string;
  aliasOf?: string;
}

const ccList = ccListJson as CcListEntry[];

function ccToTemplateKey(cc: string): string | null {
  const found = ccList.find(
    (item) => item.cc.toLowerCase() === cc.toLowerCase()
  );
  return found?.templateKey ?? null;
}

export async function normalizeInputs(
  cc: string,
  inputs: Array<{
    rawText: string;
    timeTag: string | null;
    timeOffsetMinutes: number | null;
  }>
): Promise<StructuredCase> {
  const templateKey = ccToTemplateKey(cc);
  if (!templateKey) throw new Error(`알 수 없는 C.C.: ${cc}`);

  const schema = loadSchema(templateKey);
  const userPrompt = JSON.stringify({ cc, inputs }, null, 2);

  return generateStructured<StructuredCase>(
    userPrompt,
    NORMALIZE_SYSTEM_PROMPT,
    schema
  );
}
