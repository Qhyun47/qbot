import { Suspense } from "react";
import { DashboardDesktopHeader } from "@/components/dashboard/dashboard-desktop-header";
import { DashboardGallerySheet } from "@/components/dashboard/dashboard-gallery-sheet";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { CompactHide } from "@/components/compact-hide";
import { listCasesByBed } from "@/lib/cases/queries";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getPendingCount } from "@/lib/admin/user-access-actions";
import { AdminPendingAlert } from "@/components/ai-access/admin-pending-alert";
import { RealtimeRefresh } from "@/components/cases/realtime-refresh";

async function CasesSection() {
  const cases = await listCasesByBed();
  return <DashboardView cases={cases} />;
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

export default function DashboardPage() {
  return (
    <DashboardPageShell>
      <RealtimeRefresh table="cases" />

      <CompactHide>
        <Suspense fallback={null}>
          <AdminAlertSection />
        </Suspense>
        <DashboardDesktopHeader />
      </CompactHide>

      <Suspense
        fallback={
          <p className="p-4 text-sm text-muted-foreground">불러오는 중...</p>
        }
      >
        <CasesSection />
      </Suspense>

      <CompactHide>
        <Suspense fallback={null}>
          <VersionBadge />
        </Suspense>
        <DashboardGallerySheet />
      </CompactHide>
    </DashboardPageShell>
  );
}
