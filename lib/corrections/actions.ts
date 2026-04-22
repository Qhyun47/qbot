"use server";

import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth/is-admin";

interface SaveCorrectionParams {
  caseId: string | null;
  sectionType: "pi" | "template" | "history" | "pe";
  cc: string;
  templateKey?: string;
  caseInputsJson: unknown;
  apiOutput: string;
  correctedOutput: string;
  comment?: string;
}

/**
 * 관리자가 AI 생성 결과를 교정한 내용을 저장합니다.
 * comment가 있으면 ai_style_rules 테이블에도 규칙으로 등록합니다.
 */
export async function saveCorrection(
  params: SaveCorrectionParams
): Promise<void> {
  // 관리자 권한 확인
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    throw new Error("관리자 권한이 필요합니다");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다");

  // ai_corrections 테이블에 교정 데이터 저장
  const { error: correctionError } = await supabase
    .from("ai_corrections")
    .insert({
      user_id: user.id,
      case_id: params.caseId,
      section_type: params.sectionType,
      cc: params.cc,
      template_key: params.templateKey ?? null,
      case_inputs_json: params.caseInputsJson as never,
      api_output: params.apiOutput,
      corrected_output: params.correctedOutput,
      comment: params.comment ?? null,
    });

  if (correctionError) {
    throw new Error(`교정 저장 실패: ${correctionError.message}`);
  }

  // comment가 있으면 ai_style_rules에도 규칙으로 등록
  if (params.comment && params.comment.trim()) {
    const { error: ruleError } = await supabase.from("ai_style_rules").insert({
      rule_text: params.comment.trim(),
      cc: params.cc,
      section_type: params.sectionType,
    });

    if (ruleError) {
      // 규칙 저장 실패는 교정 저장 성공에 영향을 주지 않으므로 경고만 출력
      console.warn(
        "[saveCorrection] 스타일 규칙 저장 실패:",
        ruleError.message
      );
    }
  }
}
