import { generateText } from "@/lib/ai/gemini-client";
import type { TokenUsage } from "@/lib/ai/gemini-client";
import { GENERATE_PE_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-pe";
import { FEW_SHOT_GUARD } from "@/lib/ai/prompts/few-shot-guard";
import { loadTemplate, loadExamples } from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generatePe(
  structuredCase: StructuredCase,
  templateKey: string,
  _cc: string
): Promise<{ text: string } & TokenUsage> {
  const templateData = loadTemplate(templateKey) as Record<string, unknown>;
  const peTemplate = templateData.pe ?? null;

  if (!peTemplate) return { text: "", inputTokens: 0, outputTokens: 0 };

  const { inputs, ...ccSpecificFields } = structuredCase;
  const peInputs = inputs.filter((i) => i.sections.includes("pe"));

  const referenceExamples = loadExamples(templateKey).pe.slice(0, 10);

  const systemPrompt =
    referenceExamples.length > 0
      ? `${GENERATE_PE_SYSTEM_PROMPT}\n\n## Style Reference\n\n${FEW_SHOT_GUARD}`
      : GENERATE_PE_SYSTEM_PROMPT;

  const promptData: Record<string, unknown> = {
    peInputs,
    ccSpecificFields,
    peTemplate,
  };
  if (referenceExamples.length > 0) {
    promptData.referenceExamples = referenceExamples;
  }

  const userPrompt = JSON.stringify(promptData, null, 2);

  const { text, inputTokens, outputTokens } = await generateText(
    userPrompt,
    systemPrompt,
    2000
  );
  if (!text) throw new Error("P/E 생성 실패: 빈 응답");
  return { text, inputTokens, outputTokens };
}
