import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

function createClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY 미설정");
  return new GoogleGenAI({ apiKey });
}

export async function generateText(
  prompt: string,
  systemInstruction: string,
  maxOutputTokens?: number
): Promise<string> {
  const client = createClient();
  const result = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction, ...(maxOutputTokens && { maxOutputTokens }) },
  });
  return result.text ?? "";
}

export async function generateStructured<T>(
  prompt: string,
  systemInstruction: string,
  schema: object,
  maxOutputTokens?: number
): Promise<T> {
  const client = createClient();
  const result = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
      ...(maxOutputTokens && { maxOutputTokens }),
    },
  });
  try {
    return JSON.parse(result.text ?? "{}") as T;
  } catch {
    throw new Error(
      `Gemini 구조화 응답 파싱 실패. 원문: ${result.text?.slice(0, 200)}`
    );
  }
}
