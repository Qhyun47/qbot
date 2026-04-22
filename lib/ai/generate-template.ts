import { generateText } from "@/lib/ai/gemini-client";
import { GENERATE_TEMPLATE_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-template";
import {
  loadTemplate,
  loadCorrections,
  loadStyleRules,
} from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generateTemplate(
  structuredCase: StructuredCase,
  templateKey: string,
  cc: string
): Promise<string> {
  const template = loadTemplate(templateKey);

  const { inputs, ...ccSpecificFields } = structuredCase;
  const templateInputs = inputs.filter((i) => i.sections.includes("template"));

  // 관리자 교정 데이터와 스타일 규칙을 병렬로 로드 (기존 loadExamples 대체)
  const [corrections, styleRules] = await Promise.all([
    loadCorrections(cc, "template"),
    loadStyleRules(cc, "template"),
  ]);

  // 스타일 규칙이 있으면 system prompt에 추가
  let systemPrompt = GENERATE_TEMPLATE_SYSTEM_PROMPT;
  if (styleRules.length > 0) {
    const rulesList = styleRules
      .map((rule, i) => `${i + 1}. ${rule}`)
      .join("\n");
    systemPrompt += `\n\n## Additional Rules (follow strictly):\n${rulesList}`;
  }

  // 교정 예시가 있으면 user prompt에 포함
  const promptData: Record<string, unknown> = {
    templateInputs,
    ccSpecificFields,
    template,
    fewShotExamples: corrections,
  };

  const userPrompt = JSON.stringify(promptData, null, 2);

  const result = await generateText(userPrompt, systemPrompt, 3000);
  if (!result) throw new Error("상용구 생성 실패: 빈 응답");
  return result;
}
