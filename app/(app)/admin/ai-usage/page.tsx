"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { UserActivityTab } from "./user-activity-tab";
import { UsageStatsTab } from "./usage-stats-tab";
import { ChartingResultsTab } from "./charting-results-tab";

const TABS = [
  { key: "activity", label: "사용자 활동" },
  { key: "stats", label: "사용량 통계" },
  { key: "charting", label: "차팅 결과" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminAiUsagePage() {
  const [tab, setTab] = useState<TabKey>("activity");

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* 헤더 */}
      <div className="border-b px-4 py-3">
        <h1 className="text-sm font-semibold">AI 사용 현황</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          사용자별 활동 내역과 AI API 사용량을 확인합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm transition-colors",
              tab === t.key
                ? "border-b-2 border-foreground font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div
        className={cn(
          "flex-1",
          tab === "charting" ? "overflow-hidden" : "overflow-auto"
        )}
      >
        {tab === "activity" ? (
          <UserActivityTab />
        ) : tab === "stats" ? (
          <UsageStatsTab />
        ) : (
          <ChartingResultsTab />
        )}
      </div>
    </div>
  );
}
