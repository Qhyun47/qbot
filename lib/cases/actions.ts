"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { BED_NUMBERS_BY_ZONE } from "@/lib/cases/bed-config";
import type { BedZone, CaseInput } from "@/lib/supabase/types";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다");
  return { supabase, user };
}

const bedSchema = z
  .object({
    bedZone: z.enum(["A", "B", "R"]),
    bedNumber: z.number().int(),
  })
  .refine(
    ({ bedZone, bedNumber }) => {
      const valid = BED_NUMBERS_BY_ZONE[bedZone as BedZone];
      return (valid as readonly number[]).includes(bedNumber);
    },
    { message: "유효하지 않은 베드번호" }
  );

export async function createCase(): Promise<string> {
  const { supabase, user } = await getAuthUser();

  // 사용자가 아무것도 입력하지 않은 빈 draft 정리
  // (cc=null, has_inputs=false, bed_explicitly_set=false 인 경우만 삭제)
  const { data: emptyDrafts } = await supabase
    .from("cases")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "draft")
    .is("cc", null)
    .eq("has_inputs", false)
    .eq("bed_explicitly_set", false);

  if (emptyDrafts && emptyDrafts.length > 0) {
    const ids = emptyDrafts.map((d) => d.id);
    await supabase.from("cases").delete().in("id", ids);
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "케이스 생성 실패");
  return data.id;
}

export async function updateCaseBed(
  caseId: string,
  bedZone: string,
  bedNumber: number
): Promise<void> {
  const parsed = bedSchema.parse({ bedZone, bedNumber });
  const { supabase, user } = await getAuthUser();

  // 처음 베드가 설정되는 신규 환자인지 확인 (bed_explicitly_set: false → true 전환 시점)
  const { data: existingCase } = await supabase
    .from("cases")
    .select("bed_explicitly_set")
    .eq("id", caseId)
    .eq("user_id", user.id)
    .single();

  const isFirstBedAssignment = existingCase && !existingCase.bed_explicitly_set;

  const { error } = await supabase
    .from("cases")
    .update({
      bed_zone: parsed.bedZone,
      bed_number: parsed.bedNumber,
      bed_explicitly_set: true,
    })
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  // 신규 환자 추가인 경우에만: 동일 베드 현황판 케이스 자동 제거
  if (isFirstBedAssignment) {
    const { data: conflictingCases } = await supabase
      .from("cases")
      .select("id")
      .eq("user_id", user.id)
      .eq("bed_zone", parsed.bedZone)
      .eq("bed_number", parsed.bedNumber)
      .is("board_hidden_at", null)
      .neq("id", caseId);

    if (conflictingCases && conflictingCases.length > 0) {
      const conflictingIds = conflictingCases.map((c) => c.id);

      // 현황판에서 일괄 제거 (사진은 12시간 cron이 처리)
      await supabase
        .from("cases")
        .update({ board_hidden_at: new Date().toISOString() })
        .in("id", conflictingIds);

      revalidatePath("/dashboard");
      revalidatePath("/cases");
    }
  }
}

export async function updateCaseCc(
  caseId: string,
  cc: string,
  ccHasTemplate: boolean,
  templateKey: string | null
): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("cases")
    .update({ cc, cc_has_template: ccHasTemplate, template_key: templateKey })
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function addCaseInput(
  caseId: string,
  rawText: string,
  timeTag: string | null,
  timeOffsetMinutes: number | null
): Promise<CaseInput> {
  const { supabase } = await getAuthUser();

  const { count } = await supabase
    .from("case_inputs")
    .select("*", { count: "exact", head: true })
    .eq("case_id", caseId);

  const displayOrder = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("case_inputs")
    .insert({
      case_id: caseId,
      raw_text: rawText,
      time_tag: timeTag,
      time_offset_minutes: timeOffsetMinutes,
      display_order: displayOrder,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "카드 추가 실패");

  if (displayOrder === 1) {
    await supabase.from("cases").update({ has_inputs: true }).eq("id", caseId);
  }

  return data;
}

export async function updatePiEdited(
  resultId: string,
  text: string
): Promise<void> {
  const { supabase } = await getAuthUser();

  const { error } = await supabase
    .from("case_results")
    .update({ pi_edited: text })
    .eq("id", resultId);

  if (error) throw new Error(error.message);
}

export async function updatePeEdited(
  resultId: string,
  text: string
): Promise<void> {
  const { supabase } = await getAuthUser();

  const { error } = await supabase
    .from("case_results")
    .update({ pe_edited: text })
    .eq("id", resultId);

  if (error) throw new Error(error.message);
}

export async function updateTemplateEdited(
  resultId: string,
  text: string
): Promise<void> {
  const { supabase } = await getAuthUser();

  const { error } = await supabase
    .from("case_results")
    .update({ template_edited: text })
    .eq("id", resultId);

  if (error) throw new Error(error.message);
}

export async function updateHistoryEdited(
  resultId: string,
  text: string
): Promise<void> {
  const { supabase } = await getAuthUser();

  const { error } = await supabase
    .from("case_results")
    .update({ history_edited: text })
    .eq("id", resultId);

  if (error) throw new Error(error.message);
}

export async function overrideTemplateKey(
  caseId: string,
  templateKey: string | null
): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("cases")
    .update({
      template_key: templateKey,
      cc_has_template: templateKey !== null,
    })
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function updateCaseMemo(
  caseId: string,
  memo: string
): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("cases")
    .update({ memo })
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function hideFromBoard(caseId: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("cases")
    .update({ board_hidden_at: new Date().toISOString() })
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/cases");
}

export async function hideAllFromBoard(): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("cases")
    .update({ board_hidden_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("board_hidden_at", null);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/cases");
}

export async function restoreToBoard(caseId: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("cases")
    .update({ board_hidden_at: null })
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/cases");
}

export async function reorderCaseInputs(
  updates: { id: string; displayOrder: number }[]
): Promise<void> {
  const { supabase } = await getAuthUser();
  await Promise.all(
    updates.map(({ id, displayOrder }) =>
      supabase
        .from("case_inputs")
        .update({ display_order: displayOrder })
        .eq("id", id)
    )
  );
}

export async function moveCaseInputSection(
  cardId: string,
  targetSection: "timed" | "untimed"
): Promise<void> {
  const { supabase } = await getAuthUser();
  const { error } = await supabase
    .from("case_inputs")
    .update(
      targetSection === "untimed"
        ? {
            section_override: "untimed",
            time_tag: null,
            time_offset_minutes: null,
          }
        : { section_override: "timed" }
    )
    .eq("id", cardId);
  if (error) throw new Error(error.message);
}

export async function deleteCase(caseId: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  // Storage 파일 정리 (cases 삭제 시 ON DELETE CASCADE가 DB rows는 처리하지만 Storage는 미처리)
  const { data: photos } = await supabase
    .from("case_photos")
    .select("storage_path")
    .eq("case_id", caseId);
  if (photos && photos.length > 0) {
    await supabase.storage
      .from("case-photos")
      .remove(photos.map((p) => p.storage_path));
  }

  const { error } = await supabase
    .from("cases")
    .delete()
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/cases");
  revalidatePath("/dashboard");
}

export async function deleteCaseInput(cardId: string): Promise<void> {
  const { supabase } = await getAuthUser();
  const { error } = await supabase
    .from("case_inputs")
    .delete()
    .eq("id", cardId);
  if (error) throw new Error(error.message);
}

export async function updateCaseInputText(
  cardId: string,
  rawText: string
): Promise<CaseInput> {
  const { supabase } = await getAuthUser();
  const { data, error } = await supabase
    .from("case_inputs")
    .update({ raw_text: rawText })
    .eq("id", cardId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CaseInput;
}
