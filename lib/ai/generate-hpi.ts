import { generateText } from "@/lib/ai/gemini-client";
import { GENERATE_HPI_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-hpi";
import type { StructuredCase } from "@/lib/ai/types";

export async function generateHpi(
  structuredCase: StructuredCase,
  rawInputs: Array<{ rawText: string; timeTag: string | null }>
): Promise<string> {
  const hpiInputs = structuredCase.inputs.filter((i) =>
    i.sections.includes("hpi")
  );

  const { inputs: _inputs, ...ccSpecificFields } = structuredCase;

  const userPrompt = JSON.stringify(
    {
      hpiInputs,
      ccSpecificFields,
      rawInputs,
    },
    null,
    2
  );

  const result = await generateText(userPrompt, GENERATE_HPI_SYSTEM_PROMPT);
  if (!result) throw new Error("HPI 생성 실패: 빈 응답");
  return result;
}
