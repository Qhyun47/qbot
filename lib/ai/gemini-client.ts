import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash";

function createClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY 미설정");
  return new GoogleGenAI({ apiKey });
}

export async function generateText(
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const client = createClient();
  const result = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction },
  });
  return result.text ?? "";
}

export async function generateStructured<T>(
  prompt: string,
  systemInstruction: string,
  schema: object
): Promise<T> {
  const client = createClient();
  const result = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  return JSON.parse(result.text ?? "{}") as T;
}
