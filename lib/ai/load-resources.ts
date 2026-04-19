import path from "path";
import fs from "fs";

// MVP 5개 C.C.의 templateKey 목록
export const CC_TEMPLATE_KEYS = [
  "chest-pain",
  "dyspnea",
  "hemoptysis",
  "abdominal-pain",
  "gi-bleeding",
] as const;

export type CcTemplateKey = (typeof CC_TEMPLATE_KEYS)[number];

const RESOURCES_DIR = path.join(process.cwd(), "lib/ai/resources");

// TODO(Task 010): 실제 AI 파이프라인에서 호출 시 에러 핸들링 추가
export function loadSchema(templateKey: string): object {
  const filePath = path.join(RESOURCES_DIR, "schemas", `${templateKey}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function loadTemplate(templateKey: string): object {
  const filePath = path.join(RESOURCES_DIR, "templates", `${templateKey}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function loadGuide(templateKey: string): string {
  const filePath = path.join(RESOURCES_DIR, "guides", `${templateKey}.md`);
  return fs.readFileSync(filePath, "utf-8");
}

// TODO(Task 010): examples가 채워지면 JSONL 파싱 로직으로 교체
export function loadExamples(templateKey: string): object[] {
  const filePath = path.join(RESOURCES_DIR, "examples", `${templateKey}.jsonl`);
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
