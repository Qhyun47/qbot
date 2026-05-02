import { generateText } from "@/lib/ai/gemini-client";

async function main() {
  const { text, inputTokens, outputTokens } = await generateText(
    "say hello in one word",
    "you are a helpful assistant"
  );
  console.log("RESULT:", text);
  console.log(`TOKENS: input=${inputTokens}, output=${outputTokens}`);
}

main().catch((e) => console.error("ERROR:", e.message));
