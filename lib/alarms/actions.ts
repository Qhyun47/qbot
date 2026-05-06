"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateAlarmInput = {
  title: string;
  bedZone?: string;
  bedNumber?: number;
  timeMode: "specific" | "relative";
  specificTime?: string;
  relativeMinutes?: number;
  repeatIntervalMinutes?: number;
  repeatCount?: number;
};

export type UpdateAlarmInput = CreateAlarmInput & {
  remainingRepeatCount?: number;
};

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다");
  return { supabase, user };
}

function resolveScheduledAt(input: CreateAlarmInput): string {
  if (input.timeMode === "relative") {
    const minutes = input.relativeMinutes ?? 0;
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }
  if (!input.specificTime) throw new Error("specificTime이 필요합니다");
  return new Date(input.specificTime).toISOString();
}

export async function createAlarm(input: CreateAlarmInput): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const scheduledAt = resolveScheduledAt(input);

  const { error } = await supabase.from("alarms").insert({
    user_id: user.id,
    title: input.title,
    bed_zone: input.bedZone ?? null,
    bed_number: input.bedNumber ?? null,
    scheduled_at: scheduledAt,
    repeat_interval_minutes: input.repeatIntervalMinutes ?? null,
    repeat_count: input.repeatCount ?? null,
    remaining_repeat_count: input.repeatCount ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateAlarm(
  id: string,
  input: UpdateAlarmInput
): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const scheduledAt = resolveScheduledAt(input);

  const { error } = await supabase
    .from("alarms")
    .update({
      title: input.title,
      bed_zone: input.bedZone ?? null,
      bed_number: input.bedNumber ?? null,
      scheduled_at: scheduledAt,
      repeat_interval_minutes: input.repeatIntervalMinutes ?? null,
      repeat_count: input.repeatCount ?? null,
      remaining_repeat_count:
        input.remainingRepeatCount ?? input.repeatCount ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteAlarm(id: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("alarms")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function confirmAlarm(id: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("alarms")
    .update({ is_confirmed: true, confirmed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function fireAlarm(id: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { data: alarm, error: fetchError } = await supabase
    .from("alarms")
    .select("remaining_repeat_count, repeat_interval_minutes, scheduled_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !alarm)
    throw new Error(fetchError?.message ?? "알람을 찾을 수 없습니다");

  const remaining = (alarm.remaining_repeat_count ?? 0) - 1;

  let updateError;
  if (remaining > 0) {
    const intervalMs = (alarm.repeat_interval_minutes ?? 0) * 60 * 1000;
    const nextScheduledAt = new Date(
      new Date(alarm.scheduled_at).getTime() + intervalMs
    ).toISOString();
    ({ error: updateError } = await supabase
      .from("alarms")
      .update({
        remaining_repeat_count: remaining,
        scheduled_at: nextScheduledAt,
      })
      .eq("id", id)
      .eq("user_id", user.id));
  } else {
    ({ error: updateError } = await supabase
      .from("alarms")
      .update({
        remaining_repeat_count: 0,
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id));
  }

  const error = updateError;

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
