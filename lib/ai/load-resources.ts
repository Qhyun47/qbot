import path from "path";
import fs from "fs";
import { createClient } from "@/lib/supabase/server";
import templateListJson from "@/lib/ai/resources/template-list.json";

export interface TemplateListEntry {
  templateKey: string;
  displayName: string;
}

export function loadTemplateList(): TemplateListEntry[] {
  return templateListJson as TemplateListEntry[];
}

const AI_DOCS_DIR = path.join(process.cwd(), "ai-docs");

export function loadSchema(templateKey: string): object {
  const ccPath = path.join(AI_DOCS_DIR, "cc", templateKey, "schema.json");
  if (fs.existsSync(ccPath)) {
    return JSON.parse(fs.readFileSync(ccPath, "utf-8"));
  }
  // generic fallback
  return JSON.parse(
    fs.readFileSync(path.join(AI_DOCS_DIR, "cc/_generic/schema.json"), "utf-8")
  );
}

export function loadTemplate(templateKey: string): object {
  const filePath = path.join(AI_DOCS_DIR, "cc", templateKey, "template.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function loadPe(templateKey: string): object | null {
  const templateData = loadTemplate(templateKey) as Record<string, unknown>;
  return (templateData.pe as object) ?? null;
}

export function loadHistory(templateKey: string): object | null {
  const templateData = loadTemplate(templateKey) as Record<string, unknown>;
  return (templateData.history as object) ?? null;
}

export function loadGuide(templateKey: string): string {
  const filePath = path.join(AI_DOCS_DIR, "cc", templateKey, "guide.md");
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8");
  }
  return "";
}

/**
 * ai_corrections 테이블에서 해당 cc + section_type의 최신 5개 교정 예시를 로드합니다.
 * 관리자가 저장한 교정 데이터를 few-shot 예시로 AI 프롬프트에 주입하는 데 사용합니다.
 */
export async function loadCorrections(
  cc: string,
  sectionType: "pi" | "template" | "history" | "pe"
): Promise<Array<{ input: unknown; output: string }>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_corrections")
      .select("case_inputs_json, corrected_output")
      .eq("cc", cc)
      .eq("section_type", sectionType)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data) return [];

    return data.map((row) => ({
      input: row.case_inputs_json,
      output: row.corrected_output,
    }));
  } catch {
    // 교정 데이터 로드 실패는 AI 생성을 중단시키지 않음
    return [];
  }
}

/**
 * ai_style_rules 테이블에서 해당 cc + section_type의 스타일 규칙을 로드합니다.
 * cc가 null인 규칙(전체 적용)과 section_type이 'all'인 규칙도 포함합니다.
 */
export async function loadStyleRules(
  cc: string,
  sectionType: "pi" | "template" | "history" | "pe"
): Promise<string[]> {
  try {
    const supabase = await createClient();

    // cc 일치 항목과 cc=null(전체 적용) 항목을 분리 조회 후 합산
    // — .or() 에 값을 직접 보간하면 PostgREST 필터 조작 위험이 있어 개별 쿼리로 분리
    const [ccResult, globalResult] = await Promise.all([
      supabase
        .from("ai_style_rules")
        .select("rule_text, created_at")
        .eq("cc", cc)
        .in("section_type", [sectionType, "all"]),
      supabase
        .from("ai_style_rules")
        .select("rule_text, created_at")
        .is("cc", null)
        .in("section_type", [sectionType, "all"]),
    ]);

    const combined = [
      ...(ccResult.data ?? []),
      ...(globalResult.data ?? []),
    ].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return combined.map((row) => row.rule_text);
  } catch {
    // 규칙 로드 실패는 AI 생성을 중단시키지 않음
    return [];
  }
}
