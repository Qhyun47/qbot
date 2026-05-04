import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getLayoutSettings } from "@/lib/settings/actions";
import { getServiceAccessStatus } from "@/lib/auth/service-access";
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
      foldCaseInputFontSize,
      guidelineFontSize,
      foldGuidelineFontSize,
      autoRecord,
    },
    status,
    { fresh },
  ] = await Promise.all([
    getLayoutSettings(),
    getServiceAccessStatus(),
    searchParams,
  ]);

  return (
    <NewCaseForm
      key={fresh}
      defaultLayout={layout}
      defaultSplitRatio={splitRatio}
      foldAutoSwitch={foldAutoSwitch}
      foldFallbackLayout={foldFallbackLayout}
      caseInputFontSize={caseInputFontSize}
      foldCaseInputFontSize={foldCaseInputFontSize}
      guidelineFontSize={guidelineFontSize}
      foldGuidelineFontSize={foldGuidelineFontSize}
      canUseAi={status === "approved"}
      autoRecord={autoRecord}
    />
  );
}

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ fresh?: string }>;
}) {
  const { fresh } = await searchParams;

  // fresh 파라미터가 없으면 URL에 타임스탬프를 고정한 뒤 리다이렉트한다.
  // Server Action 실행 후 Next.js가 Router Cache를 무효화하면서 이 페이지의
  // RSC를 재요청할 때, fresh가 없으면 Date.now()가 새 값이 되어 NewCaseForm의
  // key가 바뀌고 컴포넌트가 리마운트(= 상태 초기화)되는 무한 루프가 발생한다.
  if (!fresh) {
    redirect(`/cases/new?fresh=${Date.now()}`);
  }

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
