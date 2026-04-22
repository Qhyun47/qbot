import { createClient } from "@/lib/supabase/server";
import type { Case, CaseInput, CaseResult } from "@/lib/supabase/types";

export async function getCase(caseId: string): Promise<Case | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("user_id", user.id)
    .single();

  return data ?? null;
}

export async function getCaseInputs(caseId: string): Promise<CaseInput[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("case_inputs")
    .select("*")
    .eq("case_id", caseId)
    .order("display_order");

  return data ?? [];
}

export async function getCurrentResult(
  caseId: string
): Promise<CaseResult | null> {
  const supabase = await createClient();

  const { data: caseRow } = await supabase
    .from("cases")
    .select("current_result_id")
    .eq("id", caseId)
    .single();

  if (!caseRow?.current_result_id) return null;

  const { data } = await supabase
    .from("case_results")
    .select("*")
    .eq("id", caseRow.current_result_id)
    .single();

  return data ?? null;
}

export async function listCasesByBed(): Promise<Case[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", user.id)
    .is("board_hidden_at", null)
    .or("status.neq.draft,cc.not.is.null,has_inputs.eq.true")
    .order("bed_zone", { ascending: true })
    .order("bed_number", { ascending: true });

  return data ?? [];
}

export async function listCasesWithin12h(): Promise<Case[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .or("status.neq.draft,cc.not.is.null,has_inputs.eq.true")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function listRecentCases(limit = 50): Promise<Case[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
