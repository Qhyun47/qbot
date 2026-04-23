import { Suspense } from "react";
import { LayoutSettings } from "@/components/settings/layout-settings";
import { getLayoutSettings } from "@/lib/settings/actions";
import { getAiAccessInfo } from "@/lib/auth/ai-access";
import { AiAccessRequestForm } from "@/components/ai-access/ai-access-request-form";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import { InstallSection } from "@/components/settings/install-section";

async function SettingsContent() {
  const {
    layout,
    splitRatio,
    mobileFontSize,
    caseInputFontSize,
    foldAutoSwitch,
    foldFallbackLayout,
  } = await getLayoutSettings();
  return (
    <LayoutSettings
      defaultLayout={layout}
      defaultSplitRatio={splitRatio}
      defaultMobileFontSize={mobileFontSize}
      defaultCaseInputFontSize={caseInputFontSize}
      defaultFoldAutoSwitch={foldAutoSwitch}
      defaultFoldFallbackLayout={foldFallbackLayout}
    />
  );
}

async function AiAccessSection() {
  const { status } = await getAiAccessInfo();

  // 관리자는 AI 권한 섹션 미표시
  if (status === "approved") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (profile?.is_admin) return null;
    }
  }

  // 현재 이름 가져오기
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let currentName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_access_name")
      .eq("id", user.id)
      .single();
    currentName = profile?.ai_access_name ?? null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Separator />
      <div>
        <h2 className="text-base font-semibold">AI 사용 권한</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 차팅 기능 사용을 위한 관리자 허가 신청을 관리합니다.
        </p>
      </div>
      <AiAccessRequestForm status={status} currentName={currentName} />
    </div>
  );
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
        <Suspense fallback={null}>
          <AiAccessSection />
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
