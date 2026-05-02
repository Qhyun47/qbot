import { generateText } from "@/lib/ai/gemini-client";
import type { TokenUsage } from "@/lib/ai/gemini-client";
import { GENERATE_PE_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-pe";
import { FEW_SHOT_GUARD } from "@/lib/ai/prompts/few-shot-guard";
import { loadTemplate, loadExamples } from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generatePe(
  structuredCase: StructuredCase,
  templateKeys: string[],
  _cc: string
): Promise<{ text: string } & TokenUsage> {
  if (templateKeys.length === 0)
    return { text: "", inputTokens: 0, outputTokens: 0 };

  const peTemplates = templateKeys
    .map((key) => {
      const templateData = loadTemplate(key) as Record<string, unknown>;
      return templateData.pe ?? null;
    })
    .filter(Boolean);

  if (peTemplates.length === 0)
    return { text: "", inputTokens: 0, outputTokens: 0 };

  const { inputs, ...ccSpecificFields } = structuredCase;
  const peInputs = inputs.filter((i) => i.sections.includes("pe"));

  const referenceExamples = loadExamples(templateKeys[0]).pe.slice(0, 10);

  const multiTemplateInstruction =
    templateKeys.length > 1
      ? `\n\n## 다중 상용구 지시\n\npeTemplates 배열에 ${templateKeys.length}개의 P/E 양식이 있습니다. 첫 번째 양식의 내용을 전부 차팅하세요. 두 번째 양식부터는 첫 번째에 이미 포함된 항목(section)은 생략하고, 이전에 없던 새 항목만 추가하여 차팅하세요.`
      : "";

  const systemPrompt =
    referenceExamples.length > 0
      ? `${GENERATE_PE_SYSTEM_PROMPT}${multiTemplateInstruction}\n\n## Style Reference\n\n${FEW_SHOT_GUARD}`
      : `${GENERATE_PE_SYSTEM_PROMPT}${multiTemplateInstruction}`;

  const promptData: Record<string, unknown> = {
    peInputs,
    ccSpecificFields,
    ...(peTemplates.length === 1
      ? { peTemplate: peTemplates[0] }
      : { peTemplates }),
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
