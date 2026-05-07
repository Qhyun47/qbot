import { createClient } from "@/lib/supabase/server";
import type { Alarm } from "@/lib/supabase/types";

export async function listAlarms(): Promise<Alarm[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("alarms")
    .select("*")
    .eq("user_id", user.id)
    .or(`is_confirmed.eq.false,confirmed_at.gte.${since24h}`)
    .order("scheduled_at", { ascending: true });

  return data ?? [];
}

export async function listPastAlarms(
  cursor?: string,
  limit = 20
): Promise<Alarm[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const query = supabase
    .from("alarms")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_confirmed", true)
    .lt("confirmed_at", cursor ?? since24h)
    .order("confirmed_at", { ascending: false })
    .limit(limit);

  const { data } = await query;
  return data ?? [];
}
