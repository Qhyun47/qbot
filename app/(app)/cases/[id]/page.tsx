import { Suspense } from "react";
import Link from "next/link";
import { RefreshCw, AlertCircle } from "lucide-react";
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
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function FailedState({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
      <AlertCircle className="size-10 text-destructive" />
      <div className="flex flex-col gap-1">
        <p className="font-medium text-destructive">차팅 생성 실패</p>
        <p className="text-sm text-muted-foreground">
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
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
      <p className="text-muted-foreground">
        입력 카드를 추가한 뒤 차팅을 생성해 주세요.
      </p>
      <Button asChild size="sm">
        <Link href="/cases/new">새 케이스 입력으로 이동</Link>
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
      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-3">
        <BedBadge
          bedZone={caseData.bed_zone as BedZone}
          bedNumber={caseData.bed_number}
          size="lg"
        />
        <h1 className="text-xl font-semibold">
          {caseData.cc ?? "(C.C 미입력)"}
        </h1>
        <StatusBadge status={status} />
        <Button variant="outline" size="sm" className="ml-auto gap-1" disabled>
          <RefreshCw className="size-3.5" />
          재생성
        </Button>
      </div>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* 좌: 차팅 섹션 */}
        <div className="flex flex-col gap-6">
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
          <h2 className="text-sm font-medium text-muted-foreground">
            원본 입력 카드
          </h2>
          <CardTimeline cards={inputs} />
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
    <Suspense fallback={<div className="p-8">로딩 중...</div>}>
      <CaseContent params={params} />
    </Suspense>
  );
}
