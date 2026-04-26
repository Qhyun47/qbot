import { createClient } from "@/lib/supabase/server";
import { ServiceAccessStatus } from "@/lib/supabase/types";

export async function getServiceAccessStatus(): Promise<ServiceAccessStatus> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return "pending";

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, service_access_status")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) return "approved";
    return profile?.service_access_status ?? "pending";
  } catch {
    return "pending";
  }
}
