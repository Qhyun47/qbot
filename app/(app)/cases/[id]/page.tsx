import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { AlertCircle, AlertTriangle, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BedChangeButton } from "@/components/cases/bed-change-button";
import { StatusBadge } from "@/components/cases/status-badge";
import { CaseInputView } from "@/components/cases/case-input-view";
import { CardInputSection } from "@/components/cases/card-input-section";
import { ResultSection } from "@/components/cases/result-section";
import { GenerationPoller } from "@/components/cases/generation-poller";
import { RegenerateButton } from "@/components/cases/regenerate-button";
import { CcHeaderDisplay } from "@/components/cases/cc-header-display";
import { CcRetryForm } from "@/components/cases/cc-retry-form";
import { getCase, getCaseInputs, getCurrentResult } from "@/lib/cases/queries";
import {
  updatePiEdited,
  updatePeEdited,
  updateHistoryEdited,
  updateTemplateEdited,
} from "@/lib/cases/actions";
import { getLayoutSettings } from "@/lib/settings/actions";
import { Separator } from "@/components/ui/separator";
import { AiWarningBanner } from "@/components/cases/ai-warning-banner";
import { CasePhotosSection } from "@/components/cases/case-photos-section";
import { MedicationTriggerButton } from "@/components/medication/medication-trigger-button";
import { MedicationAnalysisSection } from "@/components/medication/medication-analysis-section";
import { RecordingTriggerButton } from "@/components/cases/recording-trigger-button";
import { extractPastHx } from "@/lib/medication/text-utils";
import type { CaseStatus, BedZone } from "@/lib/supabase/types";
import { ENABLE_HPI } from "@/lib/ai/feature-flags";
import { ErrorReportButton } from "@/components/cases/error-report-button";

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

function parseGeminiError(
  text: string
): { code?: number; status?: string } | null {
  // 순수 JSON 또는 "접두사: {json}" 패턴에서 Gemini 에러 객체를 추출
  const jsonMatch = text.match(/(\{[\s\S]+\})/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[1]) as {
      error?: { code?: number; status?: string };
    };
    return parsed?.error ?? null;
  } catch {
    return null;
  }
}

function formatAiErrorMessage(raw: string): string {
  // Gemini API가 반환하는 에러를 사용자 친화적인 문구로 변환
  const segments = raw.split(" / ").map((segment) => {
    // JSON 기반 Gemini API 에러 처리
    const err = parseGeminiError(segment);
    if (err?.status === "UNAVAILABLE" || err?.code === 503) {
      return "AI 서버가 일시적으로 혼잡합니다. 재생성을 시도해 주세요.";
    }
    if (err?.status === "RESOURCE_EXHAUSTED" || err?.code === 429) {
      return "AI 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
    }
    if (err) {
      return `AI 오류 (코드: ${err.code ?? "unknown"})`;
    }

    // finishReason 기반 에러 처리
    if (segment.includes("MAX_TOKENS")) {
      return "AI 응답이 너무 길어 처리에 실패했습니다. 재생성을 시도해 주세요.";
    }
    if (segment.includes("finishReason: SAFETY")) {
      return "안전 정책에 의해 AI 응답이 차단되었습니다.";
    }
    if (segment.includes("finishReason:")) {
      const match = segment.match(/finishReason:\s*(\w+)/);
      return `AI 응답 오류${match ? ` (${match[1]})` : ""}가 발생했습니다. 재생성을 시도해 주세요.`;
    }

    // 원문 데이터가 노출된 경우 제거하고 일반 메시지 반환
    if (segment.includes("원문:")) {
      return "AI 처리 중 오류가 발생했습니다. 재생성을 시도해 주세요.";
    }

    return segment;
  });
  return segments.join(" / ");
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
          {errorMessage
            ? formatAiErrorMessage(errorMessage)
            : "알 수 없는 오류가 발생했습니다."}
        </p>
      </div>
      <Button variant="destructive" size="sm" disabled>
        재시도
      </Button>
      <ErrorReportButton errorMessage={errorMessage ?? "알 수 없는 오류"} />
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

  const cookieStore = await cookies();
  const deviceTypeCookie = cookieStore.get("x-device-type")?.value;
  const isDesktopDevice = deviceTypeCookie !== "mobile";

  const [caseData, inputs, result, layoutSettings] = await Promise.all([
    getCase(id),
    getCaseInputs(id),
    getCurrentResult(id),
    getLayoutSettings(),
  ]);
  const {
    layout: inputLayout,
    splitRatio,
    foldAutoSwitch,
    foldFallbackLayout,
    caseInputFontSize,
    guidelineFontSize,
  } = layoutSettings;

  if (!caseData) notFound();

  const status = caseData.status as CaseStatus;

  const ResultView = (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <GenerationPoller caseId={caseData.id} initialStatus={status} />

      {/* 헤더 */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3">
        {/* 모바일(view=result)에서만 입력 화면으로 뒤로가기 표시 */}
        {!isDesktopDevice && showResultView && (
          <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
            <Link href={`/cases/${id}${from ? `?from=${from}` : ""}`} replace>
              <ArrowLeft className="size-4" />
              입력 화면
            </Link>
          </Button>
        )}
        {/* PC에서 항상 목록/대시보드 뒤로가기 표시 */}
        {isDesktopDevice && (
          <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
            <Link href={from === "cases" ? "/cases" : "/dashboard"}>
              <ArrowLeft className="size-4" />
              {from === "cases" ? "환자 목록" : "대시보드"}
            </Link>
          </Button>
        )}
        <BedChangeButton
          caseId={caseData.id}
          bedZone={caseData.bed_zone as BedZone}
          bedNumber={caseData.bed_number}
          size="lg"
        />
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="min-w-0 text-xl font-bold tracking-tight">
            <CcHeaderDisplay cc={caseData.cc} ccs={caseData.ccs} />
          </h1>
        </div>
        <StatusBadge status={status} />
        <RegenerateButton caseId={caseData.id} status={status} />
        <MedicationTriggerButton
          caseId={caseData.id}
          currentHistory={result?.history_edited ?? result?.history_draft ?? ""}
          defaultPastHx={extractPastHx(
            result?.history_edited ?? result?.history_draft ?? ""
          )}
          initialRawText={result?.med_raw_text ?? ""}
          initialOrganizedList={result?.med_organized_list ?? ""}
        />
        <RecordingTriggerButton caseId={caseData.id} />
      </header>

      {/* 본문: 차팅 결과 영역 */}
      <div className="flex-1 overflow-y-auto p-4 xl:p-8">
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
              <AiWarningBanner />
              {result.error_message && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">일부 생성 실패</p>
                    <p className="mt-0.5 text-xs opacity-80">
                      {formatAiErrorMessage(result.error_message)}
                    </p>
                  </div>
                </div>
              )}
              {ENABLE_HPI && (
                <ResultSection
                  title="HPI"
                  value={result.pi_edited ?? result.pi_draft ?? ""}
                  onSave={updatePiEdited.bind(null, result.id)}
                />
              )}
              {(result.template_draft || result.template_edited) && (
                <ResultSection
                  title="P.I template"
                  value={result.template_edited ?? result.template_draft ?? ""}
                  onSave={updateTemplateEdited.bind(null, result.id)}
                />
              )}
              <ResultSection
                title="History"
                value={result.history_edited ?? result.history_draft ?? ""}
                onSave={updateHistoryEdited.bind(null, result.id)}
              />
              <ResultSection
                title="P/E"
                value={result.pe_edited ?? result.pe_draft ?? ""}
                onSave={updatePeEdited.bind(null, result.id)}
              />
            </>
          )}
          {status === "draft" && <DraftState />}
          {status === "completed" && result && (
            <MedicationAnalysisSection
              antithromboticCheck={result.antithrombotic_check ?? null}
              antithromboticAt={result.antithrombotic_at ?? null}
              underlyingDisease={result.underlying_disease ?? null}
              underlyingDiseaseAt={result.underlying_disease_at ?? null}
            />
          )}
          <CasePhotosSection caseId={caseData.id} />
        </div>

        <Separator className="my-2" />

        <div className="flex flex-col gap-2 pb-4 pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            문진 정보
          </h2>
          <CardInputSection
            caseId={caseData.id}
            initialCards={inputs}
            generatedAt={result?.generated_at ?? undefined}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 모바일 입력 화면: 데스크탑에서는 렌더링하지 않음 */}
      {!isDesktopDevice && !showResultView && (
        <CaseInputView
          caseId={caseData.id}
          defaultBedZone={caseData.bed_zone as BedZone}
          defaultBedNumber={caseData.bed_number}
          defaultCc={caseData.cc}
          defaultTemplateKeys={
            caseData.template_keys ??
            (caseData.template_key ? [caseData.template_key] : [])
          }
          initialCards={inputs}
          defaultLayout={inputLayout}
          defaultSplitRatio={splitRatio}
          foldAutoSwitch={foldAutoSwitch}
          foldFallbackLayout={foldFallbackLayout}
          caseInputFontSize={caseInputFontSize}
          guidelineFontSize={guidelineFontSize}
          status={status}
          generatedAt={result?.generated_at ?? undefined}
          from={from}
        />
      )}

      {/* AI 결과 화면: 데스크탑은 항상, 모바일은 view=result일 때만 */}
      {(isDesktopDevice || showResultView) && ResultView}
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
