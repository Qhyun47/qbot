"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentResult } from "@/lib/cases/queries";
import { insertMedListToHistory } from "@/lib/medication/text-utils";

export async function appendMedListToCase(
  caseId: string,
  medListText: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 케이스 소유자 검증
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .eq("user_id", user.id)
    .single();
  if (!caseRow) throw new Error("접근 권한이 없습니다.");

  const result = await getCurrentResult(caseId);
  if (!result) throw new Error("케이스 결과를 찾을 수 없습니다.");

  const currentHistory = result.history_edited ?? result.history_draft ?? "";
  const newHistory = insertMedListToHistory(currentHistory, medListText);

  const { error } = await supabase
    .from("case_results")
    .update({ history_edited: newHistory })
    .eq("id", result.id);

  if (error) throw new Error("저장 중 오류가 발생했습니다.");

  revalidatePath(`/cases/${caseId}`);
}
