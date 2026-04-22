import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BedChangeButton } from "@/components/cases/bed-change-button";
import { StatusBadge } from "@/components/cases/status-badge";
import { CaseInputView } from "@/components/cases/case-input-view";
import { ResultSection } from "@/components/cases/result-section";
import { GenerationPoller } from "@/components/cases/generation-poller";
import { RegenerateButton } from "@/components/cases/regenerate-button";
import { CcRetryForm } from "@/components/cases/cc-retry-form";
import { CorrectionModal } from "@/components/cases/correction-modal";
import { getCase, getCaseInputs, getCurrentResult } from "@/lib/cases/queries";
import {
  updatePiEdited,
  updatePeEdited,
  updateTemplateEdited,
  updateHistoryEdited,
} from "@/lib/cases/actions";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getLayoutSettings } from "@/lib/settings/actions";
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
          키워드를 추가한 뒤 재생성을 눌러주세요.
        </p>
      </div>
    </div>
  );
}

async function CaseContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; from?: string }>;
}) {
  const [{ id }, { view, from }] = await Promise.all([params, searchParams]);
  const showResultView = view === "result";

  const [caseData, inputs, result, isAdmin, layoutSettings] = await Promise.all(
    [
      getCase(id),
      getCaseInputs(id),
      getCurrentResult(id),
      getIsAdmin(),
      getLayoutSettings(),
    ]
  );
  const { layout: inputLayout, splitRatio } = layoutSettings;

  if (!caseData) notFound();

  const status = caseData.status as CaseStatus;

  const ResultView = (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <GenerationPoller caseId={caseData.id} initialStatus={status} />

      {/* 헤더 */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3">
        {/* 모바일에서 view=result일 때만 뒤로가기 버튼 표시 */}
        {showResultView && (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1 lg:hidden"
            asChild
          >
            <Link href={`/cases/${id}${from ? `?from=${from}` : ""}`} replace>
              <ArrowLeft className="size-4" />
              입력 화면
            </Link>
          </Button>
        )}
        {/* PC에서 항상 뒤로가기 버튼 표시 */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 hidden gap-1 lg:flex"
          asChild
        >
          <Link href={from === "cases" ? "/cases" : "/dashboard"}>
            <ArrowLeft className="size-4" />
            {from === "cases" ? "케이스 목록" : "대시보드"}
          </Link>
        </Button>
        <BedChangeButton
          caseId={caseData.id}
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
        <RegenerateButton caseId={caseData.id} />
      </header>

      {/* 본문: 차팅 결과 영역 */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="flex flex-col gap-4">
          {status === "generating" && <GeneratingSkeleton />}
          {status === "failed" &&
            (result?.error_message?.includes("알 수 없는 C.C.") ? (
              <CcRetryForm caseId={caseData.id} currentCc={caseData.cc} />
            ) : (
              <FailedState errorMessage={result?.error_message ?? null} />
            ))}
          {status === "completed" && result && (
            <>
              {result.error_message && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">일부 생성 실패</p>
                    <p className="mt-0.5 text-xs opacity-80">
                      {result.error_message}
                    </p>
                  </div>
                </div>
              )}
              <ResultSection
                title="P.I"
                value={result.pi_edited ?? result.pi_draft ?? ""}
                onSave={updatePiEdited.bind(null, result.id)}
                correctionSlot={
                  isAdmin && result.pi_draft ? (
                    <CorrectionModal
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="mr-1 h-4 w-4" />
                          교정
                        </Button>
                      }
                      sectionType="pi"
                      sectionLabel="P.I"
                      cc={caseData.cc ?? ""}
                      templateKey={caseData.template_key ?? undefined}
                      caseId={caseData.id}
                      caseInputsJson={inputs}
                      apiOutput={result.pi_draft}
                    />
                  ) : undefined
                }
              />
              <ResultSection
                title="상용구"
                value={result.template_edited ?? result.template_draft ?? ""}
                onSave={updateTemplateEdited.bind(null, result.id)}
                correctionSlot={
                  isAdmin && result.template_draft ? (
                    <CorrectionModal
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="mr-1 h-4 w-4" />
                          교정
                        </Button>
                      }
                      sectionType="template"
                      sectionLabel="상용구"
                      cc={caseData.cc ?? ""}
                      templateKey={caseData.template_key ?? undefined}
                      caseId={caseData.id}
                      caseInputsJson={inputs}
                      apiOutput={result.template_draft}
                    />
                  ) : undefined
                }
              />
              <ResultSection
                title="P/E"
                value={result.pe_edited ?? result.pe_draft ?? ""}
                onSave={updatePeEdited.bind(null, result.id)}
                correctionSlot={
                  isAdmin && result.pe_draft ? (
                    <CorrectionModal
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="mr-1 h-4 w-4" />
                          교정
                        </Button>
                      }
                      sectionType="pe"
                      sectionLabel="P/E"
                      cc={caseData.cc ?? ""}
                      templateKey={caseData.template_key ?? undefined}
                      caseId={caseData.id}
                      caseInputsJson={inputs}
                      apiOutput={result.pe_draft}
                    />
                  ) : undefined
                }
              />
              <ResultSection
                title="History"
                value={result.history_edited ?? result.history_draft ?? ""}
                onSave={updateHistoryEdited.bind(null, result.id)}
                correctionSlot={
                  isAdmin && result.history_draft ? (
                    <CorrectionModal
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="mr-1 h-4 w-4" />
                          교정
                        </Button>
                      }
                      sectionType="history"
                      sectionLabel="History"
                      cc={caseData.cc ?? ""}
                      templateKey={caseData.template_key ?? undefined}
                      caseId={caseData.id}
                      caseInputsJson={inputs}
                      apiOutput={result.history_draft}
                    />
                  ) : undefined
                }
              />
            </>
          )}
          {status === "draft" && <DraftState />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 모바일 입력 화면: 데스크탑에서는 숨김, view=result일 때도 숨김 */}
      {!showResultView && (
        <div className="lg:hidden">
          <CaseInputView
            caseId={caseData.id}
            defaultBedZone={caseData.bed_zone as BedZone}
            defaultBedNumber={caseData.bed_number}
            defaultCc={caseData.cc}
            defaultTemplateKey={caseData.template_key ?? null}
            initialCards={inputs}
            defaultLayout={inputLayout}
            defaultSplitRatio={splitRatio}
            status={status}
            generatedAt={result?.generated_at ?? undefined}
            from={from}
          />
        </div>
      )}

      {/* AI 결과 화면: 데스크탑에서는 항상 표시, 모바일에서는 view=result일 때만 표시 */}
      <div className={showResultView ? "block" : "hidden lg:block"}>
        {ResultView}
      </div>
    </>
  );
}

export default function CaseResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16 text-sm text-muted-foreground">
          로딩 중...
        </div>
      }
    >
      <CaseContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
