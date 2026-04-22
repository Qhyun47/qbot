import { generateText } from "@/lib/ai/gemini-client";
import { GENERATE_HISTORY_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-history";
import {
  loadTemplate,
  loadCorrections,
  loadStyleRules,
} from "@/lib/ai/load-resources";
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
  templateKey: string | null | undefined,
  cc: string
): Promise<string> {
  if (!templateKey) return buildHistoryDraft(structuredCase);

  const templateData = loadTemplate(templateKey) as Record<string, unknown>;
  const historyTemplate = templateData.history ?? null;

  if (!historyTemplate) return buildHistoryDraft(structuredCase);

  const { inputs, ...ccSpecificFields } = structuredCase;
  const historyInputs = inputs.filter((i) => i.sections.includes("history"));

  const [corrections, styleRules] = await Promise.all([
    loadCorrections(cc, "history"),
    loadStyleRules(cc, "history"),
  ]);

  let systemPrompt = GENERATE_HISTORY_SYSTEM_PROMPT;
  if (styleRules.length > 0) {
    const rulesList = styleRules
      .map((rule, i) => `${i + 1}. ${rule}`)
      .join("\n");
    systemPrompt += `\n\n## Additional Rules (follow strictly):\n${rulesList}`;
  }

  const promptData: Record<string, unknown> = {
    historyInputs,
    ccSpecificFields,
    historyTemplate,
  };

  if (corrections.length > 0) {
    promptData.correctionExamples = corrections;
  }

  const userPrompt = JSON.stringify(promptData, null, 2);

  const result = await generateText(userPrompt, systemPrompt, 2000);
  if (!result) throw new Error("History 생성 실패: 빈 응답");
  return result;
}
