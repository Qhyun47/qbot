"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mic, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { BedBadge } from "@/components/cases/bed-badge";
import { CardTimeline } from "@/components/cases/card-timeline";
import { GuidelinePanel } from "@/components/cases/guideline-panel";
import { CardInputBar } from "@/components/cases/card-input-bar";
import type { CaseInput } from "@/lib/supabase/types";

export type HighlightTarget =
  | "guideline-tab"
  | "template-tab"
  | "mic"
  | "zap"
  | "camera"
  | "back"
  | null;

export interface MockCard {
  text: string;
  timeTag?: string;
}

interface MockCaseFormProps {
  cards?: MockCard[];
  highlightTarget?: HighlightTarget;
  highlightTooltip?: string;
  tooltipNode?: React.ReactNode;
  demoCcs?: string[];
  /** 온보딩 네비 바 높이만큼 MockCaseForm 높이를 줄여 카메라 버튼이 가리지 않도록 */
  extraBottomPadding?: number;
  children?: React.ReactNode;
}

function toInputCards(mockCards: MockCard[]): CaseInput[] {
  return mockCards.map((card, i) => ({
    id: `mock-${i}`,
    case_id: "mock-case",
    raw_text: card.text,
    time_tag: card.timeTag ?? null,
    time_offset_minutes: card.timeTag ? -720 : null,
    section_override: null,
    display_order: i + 1,
    created_at: new Date(
      Date.now() - (mockCards.length - i) * 60000
    ).toISOString(),
  }));
}

export function MockCaseForm({
  cards = [],
  highlightTarget = null,
  highlightTooltip = "",
  tooltipNode,
  demoCcs = ["Abdominal pain"],
  extraBottomPadding,
  children,
}: MockCaseFormProps) {
  // 가이드라인·상용구 탭 애니메이션용 상태
  const [forceActiveView, setForceActiveView] = useState<
    "guide" | "template" | undefined
  >(undefined);
  const [forceShowSelector, setForceShowSelector] = useState<
    boolean | undefined
  >(undefined);
  const [demoTemplateKeys, setDemoTemplateKeys] = useState<string[]>([]);

  useEffect(() => {
    if (highlightTarget === "guideline-tab") {
      // 2.5s 후 가이드라인 selector 열기, 5.5s 후 닫기
      const t1 = setTimeout(() => setForceShowSelector(true), 2500);
      const t2 = setTimeout(() => setForceShowSelector(false), 5500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    if (highlightTarget === "template-tab") {
      // 2s 후 상용구 탭으로 전환 + abdominal-pain 템플릿 로드
      // 4s 후 selector 열기, 7s 후 닫기
      const t1 = setTimeout(() => {
        setForceActiveView("template");
        setDemoTemplateKeys(["abdominal-pain"]);
      }, 2000);
      const t2 = setTimeout(() => setForceShowSelector(true), 4000);
      const t3 = setTimeout(() => setForceShowSelector(false), 7000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [highlightTarget]);

  // selector가 열려 있으면 CoachMark 비활성화 (오버레이가 리스트를 가리지 않도록)
  const isShowingSelector = forceShowSelector === true;
  const effectiveHighlightTarget: HighlightTarget = isShowingSelector
    ? null
    : highlightTarget;

  const tooltip = (target: HighlightTarget): React.ReactNode =>
    effectiveHighlightTarget === target
      ? (tooltipNode ?? highlightTooltip)
      : undefined;

  const inputCards = toInputCards(cards);

  const formHeight = extraBottomPadding
    ? `calc(100vh - ${extraBottomPadding}px)`
    : "100vh";

  return (
    <div
      className="flex flex-col overflow-hidden bg-background"
      style={{ height: formHeight }}
    >
      {/* 헤더 — 실제 NewCaseForm 헤더와 동일한 구조 */}
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
        <CoachMark
          tooltip={tooltip("back") ?? ""}
          tooltipPosition="bottom"
          active={effectiveHighlightTarget === "back"}
        >
          <Button
            variant="ghost"
            size="icon"
            className="pointer-events-none shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
        </CoachMark>
        <BedBadge bedZone="A" bedNumber={1} size="sm" />
        <button className="pointer-events-none flex min-w-0 flex-1 items-center overflow-hidden rounded-full border px-2 py-0.5 text-left">
          <span className="min-w-0 truncate text-xs">Abdominal pain</span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <CoachMark
            tooltip={tooltip("mic") ?? ""}
            tooltipPosition="bottom"
            active={effectiveHighlightTarget === "mic"}
          >
            <Button
              variant="ghost"
              size="icon"
              className="pointer-events-none size-8"
            >
              <Mic className="size-4" />
            </Button>
          </CoachMark>
          <CoachMark
            tooltip={tooltip("zap") ?? ""}
            tooltipPosition="bottom"
            active={effectiveHighlightTarget === "zap"}
          >
            <Button size="sm" className="pointer-events-none gap-1.5" disabled>
              <Zap className="size-3.5" />
              차팅 생성
            </Button>
          </CoachMark>
        </div>
      </header>

      {/* 가이드라인 패널 — 실제 GuidelinePanel 그대로 사용 */}
      <div style={{ height: "45%" }} className="overflow-hidden">
        <GuidelinePanel
          ccs={demoCcs}
          templateKeys={demoTemplateKeys}
          onGuidelineChange={() => {}}
          onTemplateChange={() => {}}
          defaultActiveView="guide"
          forceActiveView={forceActiveView}
          forceShowSelector={forceShowSelector}
          coachMarkGuidelineTab={tooltip("guideline-tab")}
          coachMarkTemplateTab={tooltip("template-tab")}
        />
      </div>

      {/* 카드 타임라인 + 입력바 — 실제 컴포넌트 사용 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="case-input-font-scope flex-1 overflow-y-auto overscroll-y-contain">
          <div className="p-4">
            <CardTimeline cards={inputCards} readOnly />
          </div>
        </div>
        <div className="pointer-events-none">
          <CardInputBar
            onSubmit={() => {}}
            coachMarkCamera={tooltip("camera")}
          />
        </div>
      </div>

      {children}
    </div>
  );
}
