import { createClient } from "@/lib/supabase/server";
import type { AiAccessStatus } from "@/lib/supabase/types";

export interface AiAccessInfo {
  status: AiAccessStatus;
  dismissed: boolean;
}

export async function getAiAccessInfo(): Promise<AiAccessInfo> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { status: "none", dismissed: false };

    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_access_status, ai_access_alert_dismissed, is_admin")
      .eq("id", user.id)
      .single();

    if (!profile) return { status: "none", dismissed: false };

    // 관리자는 항상 approved로 취급
    if (profile.is_admin) return { status: "approved", dismissed: true };

    return {
      status: (profile.ai_access_status as AiAccessStatus) ?? "none",
      dismissed: profile.ai_access_alert_dismissed ?? false,
    };
  } catch {
    return { status: "none", dismissed: false };
  }
}
