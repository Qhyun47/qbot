import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardGallerySheet } from "@/components/dashboard/dashboard-gallery-sheet";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { CompactHide } from "@/components/compact-hide";
import { listCasesByBed } from "@/lib/cases/queries";
import { listAlarms } from "@/lib/alarms/queries";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getPendingCount } from "@/lib/admin/user-access-actions";
import { AdminPendingAlert } from "@/components/ai-access/admin-pending-alert";
import { RealtimeRefresh } from "@/components/cases/realtime-refresh";
import { AlarmScheduler } from "@/components/alarms/alarm-scheduler";
import { createClient } from "@/lib/supabase/server";

async function CasesAndAlarmsSection() {
  const [cases, alarms] = await Promise.all([listCasesByBed(), listAlarms()]);
  return (
    <>
      <AlarmScheduler initialAlarms={alarms} />
      <DashboardView cases={cases} alarms={alarms} />
    </>
  );
}

async function AdminAlertSection() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return null;
  const count = await getPendingCount();
  if (count === 0) return null;
  return <AdminPendingAlert count={count} />;
}

async function VersionBadge() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return null;
  const hash =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  return (
    <p className="text-center text-xs text-muted-foreground">버전 {hash}</p>
  );
}

async function OnboardingGuard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }
  return null;
}

export default function DashboardPage() {
  return (
    <DashboardPageShell>
      <Suspense fallback={null}>
        <OnboardingGuard />
      </Suspense>
      <RealtimeRefresh table="cases" />
      <RealtimeRefresh table="alarms" />

      <CompactHide>
        <Suspense fallback={null}>
          <AdminAlertSection />
        </Suspense>
      </CompactHide>

      <Suspense
        fallback={
          <p className="p-4 text-sm text-muted-foreground">불러오는 중...</p>
        }
      >
        <CasesAndAlarmsSection />
      </Suspense>

      <CompactHide>
        <Suspense fallback={null}>
          <VersionBadge />
        </Suspense>
      </CompactHide>
      <DashboardGallerySheet />
    </DashboardPageShell>
  );
}
