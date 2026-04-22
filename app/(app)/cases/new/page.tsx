import { Suspense } from "react";
import { getLayoutSettings } from "@/lib/settings/actions";
import { getAiAccessInfo } from "@/lib/auth/ai-access";
import { NewCaseForm } from "@/components/cases/new-case-form";

async function NewCaseFormLoader() {
  const [
    { layout, splitRatio, foldAutoSwitch, foldFallbackLayout },
    { status },
  ] = await Promise.all([getLayoutSettings(), getAiAccessInfo()]);

  return (
    <NewCaseForm
      defaultLayout={layout}
      defaultSplitRatio={splitRatio}
      foldAutoSwitch={foldAutoSwitch}
      foldFallbackLayout={foldFallbackLayout}
      canUseAi={status === "approved"}
    />
  );
}

export default function NewCasePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      }
    >
      <NewCaseFormLoader />
    </Suspense>
  );
}
