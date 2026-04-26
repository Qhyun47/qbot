"use server";

import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth/is-admin";
import type { ErrorLog } from "@/lib/supabase/types";

export type ErrorLogWithEmail = ErrorLog & { email: string | null };

export async function getErrorLogs(): Promise<ErrorLogWithEmail[]> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const logs = (data ?? []) as ErrorLog[];

  if (logs.length === 0) return [];

  // user_id 목록으로 email 일괄 조회 (service_access_requests 뷰 사용)
  const userIds = [
    ...new Set(logs.map((l) => l.user_id).filter(Boolean)),
  ] as string[];

  let emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: views } = await supabase
      .from("service_access_requests")
      .select("id, email")
      .in("id", userIds);

    emailMap = Object.fromEntries(
      (views ?? []).map((v) => [v.id, v.email ?? ""])
    );
  }

  return logs.map((log) => ({
    ...log,
    email: log.user_id ? (emailMap[log.user_id] ?? null) : null,
  }));
}
