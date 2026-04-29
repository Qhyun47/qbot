import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { NewCaseButton } from "@/components/cases/new-case-button";
import { MedicationTriggerButton } from "@/components/medication/medication-trigger-button";
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

      {/* 페이지 헤더 (데스크탑) */}
      <div className="hidden items-center justify-between xl:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            현재 응급실 환자를 베드 순으로 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MedicationTriggerButton />
          <NewCaseButton className="gap-1.5" />
        </div>
      </div>

      {/* 현황판 섹션 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            현황판
          </h2>
          <div className="flex items-center gap-2">
            <div className="xl:hidden">
              <MedicationTriggerButton size="sm" />
            </div>
            <NewCaseButton className="xl:hidden" size="sm" />
            <RefreshButton />
            <HideAllFromBoardButton />
            <Link
              href="/cases"
              className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
