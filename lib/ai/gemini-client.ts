import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export type TokenUsage = { inputTokens: number; outputTokens: number };

function createClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY 미설정");
  return new GoogleGenAI({ apiKey });
}

// Gemini API는 JSON Schema draft-07의 $schema, title 등 비표준 필드를 지원하지 않음.
// 해당 필드가 있으면 모델이 스키마를 잘못 해석해 빈 응답을 반환하는 현상이 발생함.
function sanitizeSchemaForGemini(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const { $schema, title, ...rest } = schema;
  void $schema;
  void title;
  return rest;
}

function extractJson(text: string): string {
  // 마크다운 코드블록 내 JSON 추출
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (codeBlock?.[1]) return codeBlock[1];
  // 중괄호 기반 JSON 추출
  const jsonObject = text.match(/(\{[\s\S]+\})/);
  if (jsonObject?.[1]) return jsonObject[1];
  return text;
}

export async function generateText(
  prompt: string,
  systemInstruction: string,
  maxOutputTokens?: number
): Promise<{ text: string } & TokenUsage> {
  const client = createClient();
  const result = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction, ...(maxOutputTokens && { maxOutputTokens }) },
  });
  return {
    text: result.text ?? "",
    inputTokens: result.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: result.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

export async function generateStructured<T>(
  prompt: string,
  systemInstruction: string,
  schema: object,
  maxOutputTokens?: number
): Promise<{ result: T } & TokenUsage> {
  const client = createClient();
  const cleanedSchema = sanitizeSchemaForGemini(
    schema as Record<string, unknown>
  );

  const result = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: cleanedSchema,
      ...(maxOutputTokens && { maxOutputTokens }),
    },
  });

  const rawText = result.text ?? "{}";
  const tokens: TokenUsage = {
    inputTokens: result.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: result.usageMetadata?.candidatesTokenCount ?? 0,
  };

  try {
    return { result: JSON.parse(rawText) as T, ...tokens };
  } catch {
    // 마크다운 코드블록이나 접두사 텍스트가 포함된 경우 재시도
    try {
      return { result: JSON.parse(extractJson(rawText)) as T, ...tokens };
    } catch {
      const finishReason = result.candidates?.[0]?.finishReason;
      throw new Error(
        `Gemini 구조화 응답 파싱 실패 (finishReason: ${finishReason}). 원문: ${rawText.slice(0, 200)}`
      );
    }
  }
}
