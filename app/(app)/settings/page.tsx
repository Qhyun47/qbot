import { Suspense } from "react";
import { LayoutSettings } from "@/components/settings/layout-settings";
import { getLayoutSettings } from "@/lib/settings/actions";
import { Separator } from "@/components/ui/separator";
import { InstallSection } from "@/components/settings/install-section";
import { FullscreenSection } from "@/components/settings/fullscreen-section";
import { AutoRecordSection } from "@/components/settings/auto-record-section";

async function SettingsContent() {
  const {
    layout,
    splitRatio,
    mobileFontSize,
    caseInputFontSize,
    foldAutoSwitch,
    foldFallbackLayout,
    foldCaseInputFontSize,
    guidelineFontSize,
    foldGuidelineFontSize,
  } = await getLayoutSettings();
  return (
    <LayoutSettings
      defaultLayout={layout}
      defaultSplitRatio={splitRatio}
      defaultMobileFontSize={mobileFontSize}
      defaultCaseInputFontSize={caseInputFontSize}
      defaultFoldAutoSwitch={foldAutoSwitch}
      defaultFoldFallbackLayout={foldFallbackLayout}
      defaultFoldCaseInputFontSize={foldCaseInputFontSize}
      defaultGuidelineFontSize={guidelineFontSize}
      defaultFoldGuidelineFontSize={foldGuidelineFontSize}
    />
  );
}

async function FullscreenSectionWrapper() {
  const { fullscreenMode } = await getLayoutSettings();
  return <FullscreenSection defaultFullscreenMode={fullscreenMode} />;
}

async function AutoRecordSectionWrapper() {
  const { autoRecord } = await getLayoutSettings();
  return <AutoRecordSection defaultAutoRecord={autoRecord} />;
}

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          앱 사용 환경을 맞춤 설정하세요.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          }
        >
          <SettingsContent />
        </Suspense>
        <Separator />
        <Suspense fallback={null}>
          <FullscreenSectionWrapper />
        </Suspense>
        <Separator />
        <Suspense fallback={null}>
          <AutoRecordSectionWrapper />
        </Suspense>
        <Separator />
        <InstallSection />
        <Separator />
        <p className="text-center text-xs text-muted-foreground">
          버전{" "}
          {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
            "local"}
        </p>
      </div>
    </div>
  );
}
