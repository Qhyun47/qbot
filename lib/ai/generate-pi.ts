import { generateText } from "@/lib/ai/gemini-client";
import type { TokenUsage } from "@/lib/ai/gemini-client";
import { GENERATE_PI_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-pi";
import { FEW_SHOT_GUARD } from "@/lib/ai/prompts/few-shot-guard";
import { loadExamples, loadHpiHints } from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generatePi(
  structuredCase: StructuredCase,
  rawInputs: Array<{ rawText: string; timeTag: string | null }>,
  _cc: string,
  templateKey?: string | null
): Promise<{ text: string } & TokenUsage> {
  const piInputs = structuredCase.inputs.filter((i) =>
    i.sections.includes("pi")
  );

  const { inputs: _inputs, ...ccSpecificFields } = structuredCase;

  const referenceExamples = templateKey
    ? loadExamples(templateKey).hpi.slice(0, 10)
    : [];

  const hpiHints = templateKey ? loadHpiHints(templateKey) : null;

  const systemPrompt =
    referenceExamples.length > 0
      ? `${GENERATE_PI_SYSTEM_PROMPT}\n\n## Style Reference\n\n${FEW_SHOT_GUARD}`
      : GENERATE_PI_SYSTEM_PROMPT;

  const promptData: Record<string, unknown> = {
    piInputs,
    ccSpecificFields,
    rawInputs,
  };
  if (hpiHints) {
    promptData.hpiHints = hpiHints;
  }
  if (referenceExamples.length > 0) {
    promptData.referenceExamples = referenceExamples;
  }

  const userPrompt = JSON.stringify(promptData, null, 2);

  const { text, inputTokens, outputTokens } = await generateText(
    userPrompt,
    systemPrompt,
    2000
  );
  if (!text) throw new Error("P.I 생성 실패: 빈 응답");
  return { text, inputTokens, outputTokens };
}
