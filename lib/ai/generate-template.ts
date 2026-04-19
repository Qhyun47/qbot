import { generateText } from "@/lib/ai/gemini-client";
import { GENERATE_TEMPLATE_SYSTEM_PROMPT } from "@/lib/ai/prompts/generate-template";
import { loadTemplate, loadExamples } from "@/lib/ai/load-resources";
import type { StructuredCase } from "@/lib/ai/types";

export async function generateTemplate(
  structuredCase: StructuredCase,
  templateKey: string
): Promise<string> {
  const template = loadTemplate(templateKey);
  const examples = loadExamples(templateKey);

  const { inputs, ...ccSpecificFields } = structuredCase;
  const templateInputs = inputs.filter((i) => i.sections.includes("template"));

  const userPrompt = JSON.stringify(
    {
      templateInputs,
      ccSpecificFields,
      template,
      fewShotExamples: examples,
    },
    null,
    2
  );

  const result = await generateText(
    userPrompt,
    GENERATE_TEMPLATE_SYSTEM_PROMPT
  );
  if (!result) throw new Error("상용구 생성 실패: 빈 응답");
  return result;
}
