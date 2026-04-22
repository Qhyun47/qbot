import { createClient } from "@/lib/supabase/server";

/**
 * 현재 로그인된 사용자의 is_admin 여부를 조회합니다.
 * 미인증 상태이거나 조회 실패 시 false를 반환합니다.
 */
export async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    return profile?.is_admin ?? false;
  } catch {
    return false;
  }
}
