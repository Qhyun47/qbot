import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { normalizeInputs } from "../lib/ai/normalize";
import { generatePi } from "../lib/ai/generate-pi";
import { generatePe } from "../lib/ai/generate-pe";
import { generateTemplate } from "../lib/ai/generate-template";
import ccListJson from "../lib/ai/resources/cc-list.json";

interface CcListEntry {
  cc: string;
  guideKeys: string[];
  templateKeys: string[];
  aliasOf?: string;
}

interface FixtureInput {
  rawText: string;
  timeTag: string | null;
  timeOffsetMinutes: number | null;
}

interface Fixture {
  case: { cc: string; bedZone: string; bedNumber: number };
  inputs: FixtureInput[];
  expectedPi?: string;
  expectedTemplate?: string;
  expectedPe?: string;
  expectedHistory?: string;
}

function ccToTemplateKey(cc: string): string | null {
  const ccList = ccListJson as CcListEntry[];
  const found = ccList.find(
    (item) => item.cc.toLowerCase() === cc.toLowerCase()
  );
  return found?.templateKeys?.[0] ?? null;
}

function separator(label?: string) {
  const line = "=".repeat(60);
  if (label) {
    console.log(`\n${line}`);
    console.log(`  ${label}`);
    console.log(line);
  } else {
    console.log(`\n${line}`);
  }
}

async function run() {
  const fixturePath = process.argv[2];
  if (!fixturePath) {
    console.error(
      "사용법: npx tsx --env-file=.env.local scripts/ai-harness.ts <fixture-path>"
    );
    console.error(
      "예: npx tsx --env-file=.env.local scripts/ai-harness.ts fixtures/case-01.json"
    );
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), fixturePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`파일을 찾을 수 없습니다: ${absolutePath}`);
    process.exit(1);
  }

  const fixture: Fixture = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
  const { cc } = fixture.case;
  const templateKey = ccToTemplateKey(cc);

  separator();
  console.log(`Fixture  : ${fixturePath}`);
  console.log(`C.C.     : ${cc}`);
  console.log(`Template : ${templateKey ?? "(없음)"}`);
  console.log(`입력 카드: ${fixture.inputs.length}개`);

  // Stage 1
  separator("Stage 1: 입력 정규화");
  console.log("처리 중...");
  const structuredCase = await normalizeInputs(cc, fixture.inputs);
  console.log(JSON.stringify(structuredCase, null, 2));

  // Stage 2
  separator("Stage 2: P.I 생성");
  console.log("처리 중...");
  const rawInputs = fixture.inputs.map((i) => ({
    rawText: i.rawText,
    timeTag: i.timeTag,
  }));
  const pi = await generatePi(structuredCase, rawInputs, cc);

  console.log("\n[생성된 P.I]");
  console.log(pi);

  if (fixture.expectedPi) {
    console.log("\n[예상 P.I (참고)]");
    console.log(fixture.expectedPi);
  }

  console.log("\n[체크리스트]");
  console.log("  [ ] 한국어/영어 혼용 규칙 준수");
  console.log("  [ ] 시간 순서 올바름");
  console.log("  [ ] 영어 의학 용어 유지 (번역 없음)");
  console.log("  [ ] '본원 응급실 내원함'으로 종결");
  console.log("  [ ] 입력에 없는 정보 추가 없음");
  console.log("  [ ] 2~5문장 분량");

  // Stage 3
  if (templateKey) {
    separator("Stage 3: EMR 상용구 채움");
    console.log("처리 중...");
    const template = await generateTemplate(structuredCase, templateKey, cc);

    console.log("\n[생성된 상용구]");
    console.log(template);

    if (fixture.expectedTemplate) {
      console.log("\n[예상 상용구 (참고)]");
      console.log(fixture.expectedTemplate);
    }

    console.log("\n[체크리스트]");
    console.log("  [ ] output_example 형식 준수");
    console.log("  [ ] symptom_check 언급 없는 항목은 '-' 유지");
    console.log("  [ ] 입력에 없는 내용 추가 없음");
    console.log("  [ ] 줄 순서·공백·구두점 일치");

    // Stage 4
    separator("Stage 4: P/E 채움");
    console.log("처리 중...");
    const pe = await generatePe(structuredCase, templateKey, cc);

    if (pe) {
      console.log("\n[생성된 P/E]");
      console.log(pe);
    } else {
      console.log("(pe 필드 없음 — 건너뜀)");
    }

    if (fixture.expectedPe) {
      console.log("\n[예상 P/E (참고)]");
      console.log(fixture.expectedPe);
    }
  } else {
    separator("Stage 3: 건너뜀");
    console.log(
      `C.C. '${cc}'에 대한 templateKey가 없어 상용구/P/E 생성을 건너뜁니다.`
    );
  }

  separator("완료");
  console.log("파이프라인 완주.");
}

run().catch((err) => {
  console.error("\n오류 발생:", err.message ?? err);
  process.exit(1);
});
