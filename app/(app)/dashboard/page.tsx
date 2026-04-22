import { Suspense } from "react";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBoard } from "@/components/cases/status-board";
import { HideAllFromBoardButton } from "@/components/cases/hide-all-from-board-button";
import { listCasesByBed } from "@/lib/cases/queries";
import { getAiAccessInfo } from "@/lib/auth/ai-access";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getPendingCount } from "@/lib/admin/user-access-actions";
import { AiAccessOnboardingAlert } from "@/components/ai-access/ai-access-onboarding-alert";
import { AdminPendingAlert } from "@/components/ai-access/admin-pending-alert";

async function StatusBoardSection() {
  const cases = await listCasesByBed();
  return <StatusBoard cases={cases} />;
}

async function OnboardingAlertSection() {
  const { status, dismissed } = await getAiAccessInfo();
  if (status !== "none" || dismissed) return null;
  return <AiAccessOnboardingAlert />;
}

async function AdminAlertSection() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return null;
  const count = await getPendingCount();
  if (count === 0) return null;
  return <AdminPendingAlert count={count} />;
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8">
      <Suspense fallback={null}>
        <AdminAlertSection />
      </Suspense>
      <Suspense fallback={null}>
        <OnboardingAlertSection />
      </Suspense>

      {/* 모바일 새 케이스 CTA */}
      <Button
        asChild
        size="lg"
        className="h-14 w-full text-base font-semibold lg:hidden"
      >
        <Link href="/cases/new">+ 환자 추가</Link>
      </Button>

      {/* 페이지 헤더 (데스크탑) */}
      <div className="hidden items-center justify-between lg:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            현재 응급실 환자를 베드 순으로 확인합니다.
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/cases/new">
            <Plus className="size-4" />
            환자 추가
          </Link>
        </Button>
      </div>

      {/* 현황판 섹션 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            현황판
          </h2>
          <div className="flex items-center gap-2">
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
    </div>
  );
}
