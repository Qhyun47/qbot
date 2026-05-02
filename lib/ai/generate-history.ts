import { generateText } from "@/lib/ai/gemini-client";
import type { TokenUsage } from "@/lib/ai/gemini-client";
import { GENERATE_HISTORY_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-history";
import { FEW_SHOT_GUARD } from "@/lib/ai/prompts/few-shot-guard";
import { loadTemplate, loadExamples } from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export function buildHistoryDraft(structured: StructuredCase | null): string {
  const past = structured?.past_history?.join(", ") || "(-)";
  const med = structured?.medication_history?.join(", ") || "(-)";
  const op = structured?.operation_history?.join(", ") || "(-)";
  const family = structured?.family_history;

  const lines = [`Past Hx. : ${past}`, `Med Hx. : ${med}`, `Op Hx. : ${op}`];

  if (family && family.length > 0) {
    lines.push(`Family Hx. : ${family.join(", ")}`);
  }

  return lines.join("\n");
}

export async function generateHistory(
  structuredCase: StructuredCase,
  templateKeys: string[],
  _cc: string
): Promise<{ text: string } & TokenUsage> {
  if (templateKeys.length === 0)
    return {
      text: buildHistoryDraft(structuredCase),
      inputTokens: 0,
      outputTokens: 0,
    };

  const historyTemplates = templateKeys
    .map((key) => {
      const templateData = loadTemplate(key) as Record<string, unknown>;
      return templateData.history ?? null;
    })
    .filter(Boolean);

  if (historyTemplates.length === 0)
    return {
      text: buildHistoryDraft(structuredCase),
      inputTokens: 0,
      outputTokens: 0,
    };

  const { inputs, ...ccSpecificFields } = structuredCase;
  const historyInputs = inputs.filter((i) => i.sections.includes("history"));

  const referenceExamples = loadExamples(templateKeys[0]).history.slice(0, 10);

  const multiTemplateInstruction =
    templateKeys.length > 1
      ? `\n\n## 다중 상용구 지시\n\nhistoryTemplates 배열에 ${templateKeys.length}개의 History 양식이 있습니다. 첫 번째 양식의 내용을 전부 차팅하세요. 두 번째 양식부터는 첫 번째에 이미 포함된 항목(section)은 생략하고, 이전에 없던 새 항목만 추가하여 차팅하세요.`
      : "";

  const systemPrompt =
    referenceExamples.length > 0
      ? `${GENERATE_HISTORY_SYSTEM_PROMPT}${multiTemplateInstruction}\n\n## Style Reference\n\n${FEW_SHOT_GUARD}`
      : `${GENERATE_HISTORY_SYSTEM_PROMPT}${multiTemplateInstruction}`;

  const promptData: Record<string, unknown> = {
    historyInputs,
    ccSpecificFields,
    ...(historyTemplates.length === 1
      ? { historyTemplate: historyTemplates[0] }
      : { historyTemplates }),
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
  if (!text) throw new Error("History 생성 실패: 빈 응답");
  return { text, inputTokens, outputTokens };
}
