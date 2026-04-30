"use client";

import { useEffect, useState } from "react";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { MedicationTriggerButton } from "@/components/medication/medication-trigger-button";
import { NewCaseButton } from "@/components/cases/new-case-button";

/**
 * PC 환경(data-view="desktop")에서만 표시되는 대시보드 헤더.
 * 모바일에서는 렌더링되지 않으며, 창 너비와 무관하게 PC 여부로만 판단합니다.
 */
export function DashboardDesktopHeader() {
  const { viewMode } = useViewMode();
  // SSR 기본값: 표시 (PC에서 레이아웃 이탈 방지)
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => {
      setIsDesktop(
        document.documentElement.getAttribute("data-view") === "desktop"
      );
    };
    check();

    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-view"],
    });
    return () => obs.disconnect();
  }, [viewMode]);

  if (!isDesktop) return null;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          현재 응급실 환자를 베드 순으로 확인합니다.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <MedicationTriggerButton />
        <NewCaseButton className="gap-1.5" />
      </div>
    </div>
  );
}
