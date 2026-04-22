import { generateText } from "@/lib/ai/gemini-client";
import { GENERATE_PI_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-pi";
import { loadCorrections, loadStyleRules } from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generatePi(
  structuredCase: StructuredCase,
  rawInputs: Array<{ rawText: string; timeTag: string | null }>,
  cc: string
): Promise<string> {
  const piInputs = structuredCase.inputs.filter((i) =>
    i.sections.includes("pi")
  );

  const { inputs: _inputs, ...ccSpecificFields } = structuredCase;

  const [corrections, styleRules] = await Promise.all([
    loadCorrections(cc, "pi"),
    loadStyleRules(cc, "pi"),
  ]);

  let systemPrompt = GENERATE_PI_SYSTEM_PROMPT;
  if (styleRules.length > 0) {
    const rulesList = styleRules
      .map((rule, i) => `${i + 1}. ${rule}`)
      .join("\n");
    systemPrompt += `\n\n## Additional Rules (follow strictly):\n${rulesList}`;
  }

  const promptData: Record<string, unknown> = {
    piInputs,
    ccSpecificFields,
    rawInputs,
  };

  if (corrections.length > 0) {
    promptData.correctionExamples = corrections;
  }

  const userPrompt = JSON.stringify(promptData, null, 2);

  const result = await generateText(userPrompt, systemPrompt, 2000);
  if (!result) throw new Error("P.I 생성 실패: 빈 응답");
  return result;
}
