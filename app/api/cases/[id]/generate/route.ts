import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeInputs } from "@/lib/ai/normalize";
import { generateHpi } from "@/lib/ai/generate-hpi";
import { generateTemplate } from "@/lib/ai/generate-template";
import type { StructuredCase } from "@/lib/ai/types";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL_VERSION = "gemini-2.5-flash";

function buildHistoryDraft(structured: StructuredCase | null): string {
  const past = structured?.past_history?.join(", ") || "(-)";
  const med = structured?.medication_history?.join(", ") || "(-)";
  const op = structured?.operation_history?.join(", ") || "(-)";
  const family = structured?.family_history;

  const lines = [`Past Hx. : ${past}`, `Med Hx. : ${med}`, `Op Hx. : ${op}`];

  if (family && family.length > 0) {
    lines.push(`Family Hx. : ${family.join(", ")}`);
  }

  return lines.join("\n");
}

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

  // 동시 요청 중복 실행 방지
  if (caseRow.status === "generating") {
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

  await supabase.from("cases").update({ status: "generating" }).eq("id", id);

  // Stage 1: 정규화 (실패 시 전체 failed)
  let structured: StructuredCase;
  try {
    structured = await normalizeInputs(
      caseRow.cc ?? "",
      inputs.map((i) => ({
        rawText: i.raw_text,
        timeTag: i.time_tag,
        timeOffsetMinutes: i.time_offset_minutes,
      }))
    );
  } catch (e) {
    const errorMessage = `정규화 실패: ${e instanceof Error ? e.message : String(e)}`;
    const { data: failedResult } = await supabase
      .from("case_results")
      .insert({
        case_id: id,
        hpi_draft: "",
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

  // Stage 2: HPI 생성 (실패 허용)
  let hpiDraft = "";
  try {
    hpiDraft = await generateHpi(
      structured,
      inputs.map((i) => ({ rawText: i.raw_text, timeTag: i.time_tag }))
    );
  } catch {
    hpiDraft = "";
  }

  // Stage 3: 상용구 생성 (cc_has_template && template_key 있을 때만, 실패 허용)
  let templateDraft = "";
  if (caseRow.cc_has_template && caseRow.template_key) {
    try {
      templateDraft = await generateTemplate(structured, caseRow.template_key);
    } catch {
      templateDraft = "";
    }
  }

  // Stage 4: History 추출 (AI 호출 없이 Stage 1 결과에서)
  const historyDraft = buildHistoryDraft(structured);

  const { data: result, error: insertError } = await supabase
    .from("case_results")
    .insert({
      case_id: id,
      hpi_draft: hpiDraft,
      template_draft: templateDraft,
      history_draft: historyDraft,
      structured_json: structured as unknown as Json,
      model_version: MODEL_VERSION,
      template_key_used: caseRow.template_key ?? "",
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

  return NextResponse.json(
    { caseId: id, resultId: result.id },
    { status: 200 }
  );
}
