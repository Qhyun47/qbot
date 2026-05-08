import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "@/components/onboarding/onboarding-client";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("service_access_status, is_admin")
    .eq("id", user.id)
    .single();

  if (
    profile?.is_admin !== true &&
    profile?.service_access_status !== "approved"
  ) {
    redirect("/waiting");
  }

  const cookieStore = await cookies();
  const deviceType = cookieStore.get("x-device-type")?.value;
  if (deviceType === "desktop") redirect("/dashboard");

  return <OnboardingClient />;
}
