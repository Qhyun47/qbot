"use server";

import { createClient } from "@/lib/supabase/server";
import { sendAiRequestNotification } from "@/lib/ai-access/send-notification";

export async function requestAiAccess(
  name: string
): Promise<{ error?: string }> {
  if (!name.trim()) return { error: "이름을 입력해주세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("profiles")
    .update({
      ai_access_status: "pending",
      ai_access_name: name.trim(),
      ai_access_requested_at: new Date().toISOString(),
      ai_access_alert_dismissed: true,
    })
    .eq("id", user.id);

  if (error) return { error: "신청에 실패했습니다. 다시 시도해주세요." };

  // 이메일 알림 발송 (실패해도 신청 자체는 성공 처리)
  sendAiRequestNotification(name.trim(), new Date()).catch(() => {});

  return {};
}

export async function dismissAiAccessAlert(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("profiles")
    .update({ ai_access_alert_dismissed: true })
    .eq("id", user.id);
}
