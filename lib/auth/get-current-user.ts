import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    return {
      email: user.email ?? "",
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  } catch {
    return null;
  }
}
