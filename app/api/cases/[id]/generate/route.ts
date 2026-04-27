import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeInputs } from "@/lib/ai/normalize";
import { generatePi } from "@/lib/ai/generate-pi";
import { generateTemplate } from "@/lib/ai/generate-template";
import { generatePe } from "@/lib/ai/generate-pe";
import { generateHistory, buildHistoryDraft } from "@/lib/ai/generate-history";
import type { StructuredCase } from "@/lib/ai/types";
import type { Json } from "@/lib/supabase/types";

const MODEL_VERSION = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // AI 사용 권한 확인 (관리자 또는 approved 상태만 허용)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, service_access_status")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && profile?.service_access_status !== "approved") {
    return NextResponse.json(
      { error: "AI 사용 권한이 없습니다." },
      { status: 403 }
    );
  }

  // 일일 사용량 + 연속 생성 방지 체크 (관리자는 무제한)
  if (!profile?.is_admin) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tenSecondsAgo = new Date(Date.now() - 10_000);

    const [{ count: todayCount }, { count: recentCount }] = await Promise.all([
      supabase
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("ai_usage_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", tenSecondsAgo.toISOString()),
    ]);

    if ((todayCount ?? 0) >= 50) {
      return NextResponse.json(
        {
          error:
            "오늘 AI 차팅 생성 한도(50회)를 초과했습니다. 내일 다시 시도해주세요.",
        },
        { status: 429 }
      );
    }
    if ((recentCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "너무 빠른 재시도입니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
  }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!caseRow) {
    return NextResponse.json(
      { error: "케이스를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  // 원자적 CAS(Compare-and-Swap) 패턴으로 중복 실행 방지
  // — 별도 체크 후 업데이트 방식은 레이스 컨디션 위험이 있으므로 단일 원자적 업데이트 사용
  const { data: locked } = await supabase
    .from("cases")
    .update({ status: "generating" })
    .eq("id", id)
    .eq("user_id", user.id)
    .neq("status", "generating")
    .select("id")
    .single();

  if (!locked) {
    return NextResponse.json(
      { error: "이미 생성 중인 케이스입니다" },
      { status: 409 }
    );
  }

  const { data: inputRows } = await supabase
    .from("case_inputs")
    .select("*")
    .eq("case_id", id)
    .order("display_order");

  const inputs = inputRows ?? [];

  // Stage 1: 정규화 (실패 시 전체 failed)
  let structured: StructuredCase;
  try {
    structured = await normalizeInputs(
      caseRow.cc ?? "",
      inputs.map((i) => ({
        rawText: i.raw_text,
        timeTag: i.time_tag,
        timeOffsetMinutes: i.time_offset_minutes,
      })),
      caseRow.template_key
    );
  } catch (e) {
    const errorMessage = `정규화 실패: ${e instanceof Error ? e.message : String(e)}`;
    const { data: failedResult } = await supabase
      .from("case_results")
      .insert({
        case_id: id,
        pi_draft: "",
        pe_draft: "",
        template_draft: "",
        history_draft: buildHistoryDraft(null),
        structured_json: {} as Json,
        model_version: MODEL_VERSION,
        template_key_used: caseRow.template_key ?? "",
        error_message: errorMessage,
      })
      .select("id")
      .single();
    await supabase
      .from("cases")
      .update({
        status: "failed",
        current_result_id: failedResult?.id ?? null,
      })
      .eq("id", id);
    return NextResponse.json({ error: "AI 정규화 단계 실패" }, { status: 500 });
  }

  // Stage 2~5: 병렬 생성 (각 Stage 실패 허용 — 에러는 기록)
  const cc = caseRow.cc ?? "";
  let piError: string | null = null;
  let templateError: string | null = null;
  let peError: string | null = null;
  let historyError: string | null = null;

  const [piDraft, templateDraft, peDraft, historyDraft] = await Promise.all([
    generatePi(
      structured,
      inputs.map((i) => ({ rawText: i.raw_text, timeTag: i.time_tag })),
      cc,
      caseRow.template_key
    ).catch((e) => {
      piError = e instanceof Error ? e.message : String(e);
      console.error("[generate] Stage 2 P.I 실패:", piError);
      return "";
    }),
    caseRow.cc_has_template && caseRow.template_key
      ? generateTemplate(structured, caseRow.template_key, cc).catch((e) => {
          templateError = e instanceof Error ? e.message : String(e);
          console.error("[generate] Stage 3 Template 실패:", templateError);
          return "";
        })
      : Promise.resolve(""),
    caseRow.cc_has_template && caseRow.template_key
      ? generatePe(structured, caseRow.template_key, cc).catch((e) => {
          peError = e instanceof Error ? e.message : String(e);
          console.error("[generate] Stage 4 P/E 실패:", peError);
          return "";
        })
      : Promise.resolve(""),
    generateHistory(structured, caseRow.template_key, cc).catch((e) => {
      historyError = e instanceof Error ? e.message : String(e);
      console.error("[generate] Stage 5 History 실패:", historyError);
      return buildHistoryDraft(structured);
    }),
  ]);

  // Stage 2/3/4/5 부분 실패 메시지 합산 (Stage 1 성공이므로 status는 completed 유지)
  const partialErrorMessage =
    [piError, templateError, peError, historyError]
      .filter(Boolean)
      .join(" / ") || null;

  const { data: result, error: insertError } = await supabase
    .from("case_results")
    .insert({
      case_id: id,
      pi_draft: piDraft,
      pe_draft: peDraft,
      template_draft: templateDraft,
      history_draft: historyDraft,
      structured_json: structured as unknown as Json,
      model_version: MODEL_VERSION,
      template_key_used: caseRow.template_key ?? "",
      error_message: partialErrorMessage,
    })
    .select("id")
    .single();

  if (insertError || !result) {
    await supabase.from("cases").update({ status: "failed" }).eq("id", id);
    return NextResponse.json(
      { error: "결과 저장에 실패했습니다" },
      { status: 500 }
    );
  }

  await supabase
    .from("cases")
    .update({ status: "completed", current_result_id: result.id })
    .eq("id", id);

  // 사용 이력 기록 (실패해도 생성 결과에 영향 없음)
  await supabase
    .from("ai_usage_logs")
    .insert({ user_id: user.id, case_id: id });

  return NextResponse.json(
    { caseId: id, resultId: result.id },
    { status: 200 }
  );
}
