import { Suspense } from "react";
import Link from "next/link";
import { RefreshCw, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
import { CardTimeline } from "@/components/cases/card-timeline";
import { ResultSection } from "@/components/cases/result-section";
import {
  MOCK_CASES,
  MOCK_CASE_INPUTS,
  MOCK_CASE_RESULTS,
} from "@/lib/mock/cases";
import type { CaseStatus, BedZone } from "@/lib/supabase/types";

function GeneratingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/30 px-4 py-2.5">
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="p-4">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/30 px-4 py-2.5">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="p-4">
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

function FailedState({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-10 text-center dark:border-red-800 dark:bg-red-950/30">
      <AlertCircle className="size-9 text-red-500" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-red-700 dark:text-red-400">
          차팅 생성 실패
        </p>
        <p className="text-sm text-red-600/80 dark:text-red-500/80">
          {errorMessage ?? "알 수 없는 오류가 발생했습니다."}
        </p>
      </div>
      <Button variant="destructive" size="sm" disabled>
        재시도
      </Button>
    </div>
  );
}

function DraftState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
      <FileText className="size-9 text-muted-foreground/50" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">차팅이 아직 생성되지 않았습니다.</p>
        <p className="text-xs text-muted-foreground">
          입력 카드를 추가한 뒤 차팅을 생성해 주세요.
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href="/cases/new">케이스 입력으로 이동</Link>
      </Button>
    </div>
  );
}

async function CaseContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const caseData = MOCK_CASES.find((c) => c.id === id) ?? MOCK_CASES[0];
  const inputs = MOCK_CASE_INPUTS.filter((i) => i.case_id === caseData.id);
  const result = caseData.current_result_id
    ? MOCK_CASE_RESULTS.find((r) => r.id === caseData.current_result_id)
    : null;

  const status = caseData.status as CaseStatus;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* 페이지 헤더 */}
      <div className="flex flex-wrap items-center gap-3 border-b pb-5">
        <BedBadge
          bedZone={caseData.bed_zone as BedZone}
          bedNumber={caseData.bed_number}
          size="lg"
        />
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-xl font-bold tracking-tight">
            {caseData.cc ?? (
              <span className="font-normal italic text-muted-foreground">
                C.C 미입력
              </span>
            )}
          </h1>
        </div>
        <StatusBadge status={status} />
        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5"
          disabled
        >
          <RefreshCw className="size-3.5" />
          재생성
        </Button>
      </div>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* 좌: 차팅 섹션 */}
        <div className="flex flex-col gap-4">
          {status === "generating" && <GeneratingSkeleton />}
          {status === "failed" && (
            <FailedState errorMessage={result?.error_message ?? null} />
          )}
          {status === "completed" && result && (
            <>
              <ResultSection
                title="HPI"
                value={result.hpi_edited ?? result.hpi_draft}
              />
              <ResultSection
                title="상용구"
                value={result.template_edited ?? result.template_draft}
              />
            </>
          )}
          {status === "draft" && <DraftState />}
        </div>

        {/* 우: 원본 카드 타임라인 */}
        <aside className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            원본 입력 카드
          </h2>
          <CardTimeline cards={inputs} readOnly />
        </aside>
      </div>
    </div>
  );
}

export default function CaseResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16 text-sm text-muted-foreground">
          로딩 중...
        </div>
      }
    >
      <CaseContent params={params} />
    </Suspense>
  );
}
