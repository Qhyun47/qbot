/**
 * 0단계 사전 검증 스크립트
 * B키(GEMINI_FREE_API_KEY) + gemini-3-flash-preview 환경에서
 * responseMimeType + responseSchema 기능이 정상 작동하는지 확인합니다.
 */
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const FREE_MODEL = "gemini-3-flash-preview";

const TEST_SCHEMA = {
  type: "object",
  properties: {
    chief_complaint: { type: "string" },
    onset: { type: "string" },
    severity: { type: "number" },
  },
  required: ["chief_complaint", "onset", "severity"],
};

async function main() {
  const apiKey = process.env.GEMINI_FREE_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_FREE_API_KEY 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  console.log(`모델: ${FREE_MODEL}`);
  console.log("responseSchema 포함 구조화 출력 테스트 시작...\n");

  const client = new GoogleGenAI({ apiKey });

  const result = await client.models.generateContent({
    model: FREE_MODEL,
    contents: "환자: 30세 남성, 2시간 전부터 시작된 흉통, 통증 강도 7/10",
    config: {
      systemInstruction:
        "환자 정보에서 chief_complaint, onset, severity(0-10)를 추출하세요.",
      responseMimeType: "application/json",
      responseSchema: TEST_SCHEMA,
    },
  });

  const text = result.text ?? "";
  console.log("원문 응답:", text);

  const parsed = JSON.parse(text);
  console.log("\n파싱 결과:", JSON.stringify(parsed, null, 2));
  console.log("\n✅ 검증 성공: B키 + responseSchema 정상 작동 확인");
}

main().catch((e) => {
  console.error("\n❌ 검증 실패:", e.message);
  process.exit(1);
});
