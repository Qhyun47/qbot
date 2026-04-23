import { Suspense } from "react";
import { getLayoutSettings } from "@/lib/settings/actions";
import { getAiAccessInfo } from "@/lib/auth/ai-access";
import { NewCaseForm } from "@/components/cases/new-case-form";

async function NewCaseFormLoader({
  searchParams,
}: {
  searchParams: Promise<{ fresh?: string }>;
}) {
  const [
    {
      layout,
      splitRatio,
      foldAutoSwitch,
      foldFallbackLayout,
      caseInputFontSize,
    },
    { status },
    { fresh },
  ] = await Promise.all([getLayoutSettings(), getAiAccessInfo(), searchParams]);

  // fresh가 없는 경우(URL 직접 접근 등)에도 항상 고유한 key를 보장
  const formKey = fresh ?? String(Date.now());

  return (
    <NewCaseForm
      key={formKey}
      defaultLayout={layout}
      defaultSplitRatio={splitRatio}
      foldAutoSwitch={foldAutoSwitch}
      foldFallbackLayout={foldFallbackLayout}
      caseInputFontSize={caseInputFontSize}
      canUseAi={status === "approved"}
    />
  );
}

export default function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ fresh?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      }
    >
      <NewCaseFormLoader searchParams={searchParams} />
    </Suspense>
  );
}
