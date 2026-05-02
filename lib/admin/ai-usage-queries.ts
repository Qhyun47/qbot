"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth/is-admin";

// Gemini 2.5 Flash 기준 추정 단가 ($/토큰)
const INPUT_COST_PER_TOKEN = 0.15 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 0.6 / 1_000_000;

function calcEstimatedCost(inputTokens: number, outputTokens: number): number {
  return (
    inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN
  );
}

export interface UserActivitySummary {
  id: string;
  email: string | null;
  full_name: string | null;
  case_count: number;
  ai_usage_count: number;
  last_activity: string | null;
}

export interface UserCaseSummary {
  id: string;
  cc: string | null;
  ccs: string[] | null;
  status: string;
  created_at: string;
  has_result: boolean;
}

export interface CaseDetail {
  inputs: Array<{
    id: string;
    raw_text: string;
    time_tag: string | null;
    display_order: number;
  }>;
  result: {
    pi_draft: string;
    pi_edited: string | null;
    template_draft: string;
    template_edited: string | null;
    pe_draft: string;
    pe_edited: string | null;
    history_draft: string;
    history_edited: string | null;
    generated_at: string;
    model_version: string;
    error_message: string | null;
  } | null;
}

export interface DailyUsageStat {
  date: string;
  total_calls: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
}

export interface UserUsageStat {
  user_id: string;
  email: string | null;
  full_name: string | null;
  total_calls: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  daily: DailyUsageStat[];
}

export async function getUserActivityList(): Promise<UserActivitySummary[]> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  if (!profiles || profiles.length === 0) return [];

  const { data: authUsers } = await adminSupabase.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailMap = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

  const userIds = profiles.map((p) => p.id);

  const [{ data: caseCounts }, { data: usageCounts }] = await Promise.all([
    supabase.from("cases").select("user_id, created_at").in("user_id", userIds),
    supabase
      .from("ai_usage_logs")
      .select("user_id, created_at")
      .in("user_id", userIds),
  ]);

  const caseCountMap = new Map<string, number>();
  const lastActivityMap = new Map<string, string>();

  for (const c of caseCounts ?? []) {
    caseCountMap.set(c.user_id, (caseCountMap.get(c.user_id) ?? 0) + 1);
    const prev = lastActivityMap.get(c.user_id);
    if (!prev || c.created_at > prev)
      lastActivityMap.set(c.user_id, c.created_at);
  }

  const aiCountMap = new Map<string, number>();
  for (const u of usageCounts ?? []) {
    aiCountMap.set(u.user_id, (aiCountMap.get(u.user_id) ?? 0) + 1);
  }

  return profiles.map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) ?? null,
    full_name: p.full_name,
    case_count: caseCountMap.get(p.id) ?? 0,
    ai_usage_count: aiCountMap.get(p.id) ?? 0,
    last_activity: lastActivityMap.get(p.id) ?? null,
  }));
}

export async function getUserCases(userId: string): Promise<UserCaseSummary[]> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();

  const { data: cases } = await supabase
    .from("cases")
    .select("id, cc, ccs, status, created_at, current_result_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (cases ?? []).map((c) => ({
    id: c.id,
    cc: c.cc,
    ccs: c.ccs,
    status: c.status,
    created_at: c.created_at,
    has_result: !!c.current_result_id,
  }));
}

export async function getCaseDetail(caseId: string): Promise<CaseDetail> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return { inputs: [], result: null };

  const supabase = await createClient();

  const [{ data: inputs }, { data: cases }] = await Promise.all([
    supabase
      .from("case_inputs")
      .select("id, raw_text, time_tag, display_order")
      .eq("case_id", caseId)
      .order("display_order"),
    supabase
      .from("cases")
      .select("current_result_id")
      .eq("id", caseId)
      .single(),
  ]);

  let result: CaseDetail["result"] = null;
  if (cases?.current_result_id) {
    const { data: r } = await supabase
      .from("case_results")
      .select(
        "pi_draft, pi_edited, template_draft, template_edited, pe_draft, pe_edited, history_draft, history_edited, generated_at, model_version, error_message"
      )
      .eq("id", cases.current_result_id)
      .single();
    result = r ?? null;
  }

  return {
    inputs: (inputs ?? []).map((i) => ({
      id: i.id,
      raw_text: i.raw_text,
      time_tag: i.time_tag,
      display_order: i.display_order,
    })),
    result,
  };
}

export async function getUsageStats(
  from: string,
  to: string
): Promise<UserUsageStat[]> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("ai_usage_logs")
    .select("user_id, created_at, input_tokens, output_tokens")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: true });

  if (!logs || logs.length === 0) return [];

  const { data: authUsers } = await adminSupabase.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailMap = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

  const userIds = [...new Set(logs.map((l) => l.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);
  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? null])
  );

  const userMap = new Map<string, UserUsageStat>();

  for (const log of logs) {
    const inputT = log.input_tokens ?? 0;
    const outputT = log.output_tokens ?? 0;
    const date = log.created_at.slice(0, 10);

    if (!userMap.has(log.user_id)) {
      userMap.set(log.user_id, {
        user_id: log.user_id,
        email: emailMap.get(log.user_id) ?? null,
        full_name: nameMap.get(log.user_id) ?? null,
        total_calls: 0,
        input_tokens: 0,
        output_tokens: 0,
        estimated_cost: 0,
        daily: [],
      });
    }

    const stat = userMap.get(log.user_id)!;
    stat.total_calls += 1;
    stat.input_tokens += inputT;
    stat.output_tokens += outputT;
    stat.estimated_cost += calcEstimatedCost(inputT, outputT);

    const dayEntry = stat.daily.find((d) => d.date === date);
    if (dayEntry) {
      dayEntry.total_calls += 1;
      dayEntry.input_tokens += inputT;
      dayEntry.output_tokens += outputT;
      dayEntry.estimated_cost += calcEstimatedCost(inputT, outputT);
    } else {
      stat.daily.push({
        date,
        total_calls: 1,
        input_tokens: inputT,
        output_tokens: outputT,
        estimated_cost: calcEstimatedCost(inputT, outputT),
      });
    }
  }

  return [...userMap.values()].sort((a, b) => b.total_calls - a.total_calls);
}
