import { generateText } from "@/lib/ai/gemini-client";
import { GENERATE_PE_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-pe";
import {
  loadTemplate,
  loadCorrections,
  loadStyleRules,
} from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generatePe(
  structuredCase: StructuredCase,
  templateKey: string,
  cc: string
): Promise<string> {
  const templateData = loadTemplate(templateKey) as Record<string, unknown>;
  const peTemplate = templateData.pe ?? null;

  if (!peTemplate) return "";

  const { inputs, ...ccSpecificFields } = structuredCase;
  const peInputs = inputs.filter((i) => i.sections.includes("pe"));

  const [corrections, styleRules] = await Promise.all([
    loadCorrections(cc, "pe"),
    loadStyleRules(cc, "pe"),
  ]);

  let systemPrompt = GENERATE_PE_SYSTEM_PROMPT;
  if (styleRules.length > 0) {
    const rulesList = styleRules
      .map((rule, i) => `${i + 1}. ${rule}`)
      .join("\n");
    systemPrompt += `\n\n## Additional Rules (follow strictly):\n${rulesList}`;
  }

  const promptData: Record<string, unknown> = {
    peInputs,
    ccSpecificFields,
    peTemplate,
  };

  if (corrections.length > 0) {
    promptData.correctionExamples = corrections;
  }

  const userPrompt = JSON.stringify(promptData, null, 2);

  const result = await generateText(userPrompt, systemPrompt, 2000);
  if (!result) throw new Error("P/E 생성 실패: 빈 응답");
  return result;
}
