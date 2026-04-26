import { GoogleGenAI } from "@google/genai";

const FREE_MODEL = "gemini-3-flash-preview";

function createFreeClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_FREE_API_KEY;
  if (!apiKey) throw new Error("GEMINI_FREE_API_KEY 미설정");
  return new GoogleGenAI({ apiKey });
}

export async function generateMedAnalysisText(
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const client = createFreeClient();
  const result = await client.models.generateContent({
    model: FREE_MODEL,
    contents: prompt,
    config: { systemInstruction },
  });
  return result.text ?? "";
}
