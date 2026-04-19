import { LayoutSettings } from "@/components/settings/layout-settings";

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-6 text-xl font-semibold">설정</h1>
      <LayoutSettings />
    </div>
  );
}
