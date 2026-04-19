import { LayoutSettings } from "@/components/settings/layout-settings";

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          앱 사용 환경을 맞춤 설정하세요.
        </p>
      </div>
      <LayoutSettings />
    </div>
  );
}
