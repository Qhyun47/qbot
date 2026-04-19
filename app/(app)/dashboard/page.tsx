import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseCard } from "@/components/cases/case-card";
import { MOCK_CASES } from "@/lib/mock/cases";

export default function DashboardPage() {
  const recentCases = MOCK_CASES.slice(0, 3);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      {/* 모바일 새 케이스 CTA */}
      <Button
        asChild
        size="lg"
        className="h-14 w-full text-base font-semibold md:hidden"
      >
        <Link href="/cases/new">+ 새 케이스 시작</Link>
      </Button>

      {/* 페이지 헤더 (데스크탑) */}
      <div className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            최근 케이스를 확인하고 새 케이스를 시작하세요.
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/cases/new">
            <Plus className="size-4" />새 케이스
          </Link>
        </Button>
      </div>

      {/* 최근 케이스 섹션 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            최근 케이스
          </h2>
          <Link
            href="/cases"
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            전체 보기
            <ChevronRight className="size-3" />
          </Link>
        </div>

        {recentCases.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              아직 케이스가 없습니다.
            </p>
            <Button asChild size="sm">
              <Link href="/cases/new">첫 케이스 시작하기</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentCases.map((c) => (
              <CaseCard key={c.id} case={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
