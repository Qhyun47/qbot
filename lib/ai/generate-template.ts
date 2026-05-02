import { generateText } from "@/lib/ai/gemini-client";
import type { TokenUsage } from "@/lib/ai/gemini-client";
import { GENERATE_TEMPLATE_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-template";
import { FEW_SHOT_GUARD } from "@/lib/ai/prompts/few-shot-guard";
import { loadTemplate, loadExamples } from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generateTemplate(
  structuredCase: StructuredCase,
  templateKey: string,
  _cc: string
): Promise<{ text: string } & TokenUsage> {
  const template = loadTemplate(templateKey) as Record<string, unknown>;
  // pe, history 섹션은 별도 Stage에서 생성되므로 AI에 노출하지 않음
  // (모델이 output_example 범위를 벗어나 해당 섹션까지 출력하는 것을 방지)
  const { pe: _pe, history: _history, ...templateForAi } = template;

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
    template: templateForAi,
  };
  if (referenceExamples.length > 0) {
    promptData.referenceExamples = referenceExamples;
  }

  const userPrompt = JSON.stringify(promptData, null, 2);

  const { text, inputTokens, outputTokens } = await generateText(
    userPrompt,
    systemPrompt,
    5000
  );
  if (!text) throw new Error("상용구 생성 실패: 빈 응답");
  return { text, inputTokens, outputTokens };
}
