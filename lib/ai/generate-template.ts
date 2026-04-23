import { generateText } from "@/lib/ai/gemini-client";
import { GENERATE_TEMPLATE_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-template";
import { FEW_SHOT_GUARD } from "@/lib/ai/prompts/few-shot-guard";
import { loadTemplate, loadExamples } from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generateTemplate(
  structuredCase: StructuredCase,
  templateKey: string,
  _cc: string
): Promise<string> {
  const template = loadTemplate(templateKey);

  const { inputs, ...ccSpecificFields } = structuredCase;
  const templateInputs = inputs.filter((i) => i.sections.includes("template"));

  const referenceExamples = loadExamples(templateKey).template.slice(0, 10);

  const systemPrompt =
    referenceExamples.length > 0
      ? `${GENERATE_TEMPLATE_SYSTEM_PROMPT}\n\n## Style Reference\n\n${FEW_SHOT_GUARD}`
      : GENERATE_TEMPLATE_SYSTEM_PROMPT;

  const promptData: Record<string, unknown> = {
    templateInputs,
    ccSpecificFields,
    template,
  };
  if (referenceExamples.length > 0) {
    promptData.referenceExamples = referenceExamples;
  }

  const userPrompt = JSON.stringify(promptData, null, 2);

  const result = await generateText(userPrompt, systemPrompt, 3000);
  if (!result) throw new Error("상용구 생성 실패: 빈 응답");
  return result;
}
