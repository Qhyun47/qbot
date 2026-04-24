"use client";

import { useEffect, useState } from "react";
import { NewCaseButton } from "@/components/cases/new-case-button";
import { useViewMode } from "@/lib/hooks/use-view-mode";

/**
 * 모바일 환경에서만 상단바에 표시되는 환자 추가 버튼.
 * PC 환경(data-view="desktop")에서는 렌더링되지 않으며,
 * 대신 대시보드 페이지 내의 버튼을 사용합니다.
 */
export function HeaderNewCaseButton() {
  const { viewMode } = useViewMode();
  // SSR 기본값: 숨김 (PC에서 불필요한 버튼 노출 방지)
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => {
      setIsDesktop(
        document.documentElement.getAttribute("data-view") === "desktop"
      );
    };
    check();

    // data-view 속성 변경(뷰 모드 전환) 감지
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-view"],
    });
    return () => obs.disconnect();
  }, [viewMode]);

  if (isDesktop) return null;
  return <NewCaseButton size="sm" />;
}
