import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { DashboardDesktopHeader } from "@/components/dashboard/dashboard-desktop-header";
import { DashboardGallerySheet } from "@/components/dashboard/dashboard-gallery-sheet";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { StatusBoard } from "@/components/cases/status-board";
import { HideAllFromBoardButton } from "@/components/cases/hide-all-from-board-button";
import { listCasesByBed } from "@/lib/cases/queries";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getPendingCount } from "@/lib/admin/user-access-actions";
import { AdminPendingAlert } from "@/components/ai-access/admin-pending-alert";
import { RealtimeRefresh } from "@/components/cases/realtime-refresh";

async function StatusBoardSection() {
  const cases = await listCasesByBed();
  return <StatusBoard cases={cases} />;
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
    <div className="flex flex-col gap-8 p-4 xl:p-8">
      <RealtimeRefresh table="cases" />
      <Suspense fallback={null}>
        <AdminAlertSection />
      </Suspense>

      {/* 페이지 헤더 (PC 전용 — data-view="desktop" 기준) */}
      <DashboardDesktopHeader />

      {/* 현황판 섹션 */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-y-1">
          <h2 className="shrink-0 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            현황판
          </h2>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <RefreshButton />
            <HideAllFromBoardButton />
            <Link
              href="/cases"
              className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              전체 보기
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          }
        >
          <StatusBoardSection />
        </Suspense>
      </section>
      <Suspense fallback={null}>
        <VersionBadge />
      </Suspense>

      {/* 사진 갤러리 FAB — 모바일/PC 공통 */}
      <DashboardGallerySheet />
    </div>
  );
}
