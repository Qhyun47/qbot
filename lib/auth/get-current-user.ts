import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

// cache()로 감싸 동일 요청 내 여러 Server Component가 호출해도 DB 쿼리는 1회만 실행
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    return {
      email: user.email,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  } catch {
    return null;
  }
});
