import { generateText } from "@/lib/ai/gemini-client";

async function main() {
  const result = await generateText(
    "say hello in one word",
    "you are a helpful assistant"
  );
  console.log("RESULT:", result);
}

main().catch((e) => console.error("ERROR:", e.message));
