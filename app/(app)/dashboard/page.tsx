import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseCard } from "@/components/cases/case-card";
import { MOCK_CASES } from "@/lib/mock/cases";

export default function DashboardPage() {
  const recentCases = MOCK_CASES.slice(0, 3);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">대시보드</h1>
        <Button asChild className="hidden gap-1 md:flex">
          <Link href="/cases/new">
            <Plus className="size-4" />새 케이스
          </Link>
        </Button>
      </div>

      <Button asChild size="lg" className="h-16 w-full text-lg md:hidden">
        <Link href="/cases/new">새 케이스 시작</Link>
      </Button>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          최근 케이스
        </h2>
        {recentCases.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground">아직 케이스가 없습니다.</p>
            <Button asChild>
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
        <Link
          href="/cases"
          className="mt-1 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          전체 목록 보기 →
        </Link>
      </section>
    </div>
  );
}
