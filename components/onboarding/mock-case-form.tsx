"use client";

import {
  ArrowLeft,
  BookOpen,
  Camera,
  FileText,
  Mic,
  SendHorizontal,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { BedBadge } from "@/components/cases/bed-badge";
import { CardTimeline } from "@/components/cases/card-timeline";
import type { CaseInput } from "@/lib/supabase/types";

export type MockTab = "가이드라인" | "상용구";
export type HighlightTarget =
  | "guideline-tab"
  | "template-tab"
  | "mic"
  | "zap"
  | "camera"
  | "gallery"
  | null;

export interface MockCard {
  text: string;
  timeTag?: string;
}

interface MockCaseFormProps {
  activeTab: MockTab;
  cards?: MockCard[];
  inputText?: string;
  showTimeBanner?: boolean;
  highlightTarget?: HighlightTarget;
  highlightTooltip?: string;
  tooltipNode?: React.ReactNode;
  guidelineContent?: React.ReactNode;
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
  activeTab,
  cards = [],
  inputText = "",
  showTimeBanner = false,
  highlightTarget = null,
  highlightTooltip = "",
  tooltipNode,
  guidelineContent,
  children,
}: MockCaseFormProps) {
  const getTooltip = (target: HighlightTarget): React.ReactNode =>
    highlightTarget === target ? (tooltipNode ?? highlightTooltip) : "";

  const inputCards = toInputCards(cards);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* 헤더 — 실제 NewCaseForm 헤더와 동일한 구조 */}
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-none shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <BedBadge bedZone="A" bedNumber={1} size="sm" />
        <button className="pointer-events-none flex min-w-0 flex-1 items-center overflow-hidden rounded-full border px-2 py-0.5 text-left">
          <span className="min-w-0 truncate text-xs">Abdominal pain</span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <CoachMark
            tooltip={getTooltip("mic")}
            tooltipPosition="bottom"
            active={highlightTarget === "mic"}
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
            tooltip={getTooltip("zap")}
            tooltipPosition="bottom"
            active={highlightTarget === "zap"}
          >
            <Button size="sm" className="pointer-events-none gap-1.5" disabled>
              <Zap className="size-3.5" />
              차팅 생성
            </Button>
          </CoachMark>
        </div>
      </header>

      {/* 가이드라인 패널 — 실제 GuidelinePanel과 동일한 구조 */}
      <div
        className="flex flex-col overflow-hidden bg-muted/30"
        style={{ height: "45%" }}
      >
        {/* 탭 바 — border-b-2 언더라인 스타일 */}
        <div className="flex border-b bg-muted/20">
          <CoachMark
            tooltip={getTooltip("guideline-tab")}
            tooltipPosition="bottom"
            active={highlightTarget === "guideline-tab"}
            wrapperClassName="flex flex-1"
          >
            <button
              className={[
                "pointer-events-none flex flex-1 select-none flex-col items-start gap-0.5 border-b-2 px-3 py-2.5 text-left",
                activeTab === "가이드라인"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground",
              ].join(" ")}
            >
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-3 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  가이드라인
                </span>
              </div>
              <span className="w-full truncate text-xs font-normal normal-case text-muted-foreground">
                {activeTab === "가이드라인" ? "Abdominal pain" : "선택 안 됨"}
              </span>
            </button>
          </CoachMark>

          <div className="w-px shrink-0 self-stretch bg-border" />

          <CoachMark
            tooltip={getTooltip("template-tab")}
            tooltipPosition="bottom"
            active={highlightTarget === "template-tab"}
            wrapperClassName="flex flex-1"
          >
            <button
              className={[
                "pointer-events-none flex flex-1 select-none flex-col items-start gap-0.5 border-b-2 px-3 py-2.5 text-left",
                activeTab === "상용구"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground",
              ].join(" ")}
            >
              <div className="flex items-center gap-1.5">
                <FileText className="size-3 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  상용구
                </span>
              </div>
              <span className="w-full truncate text-xs font-normal normal-case text-muted-foreground">
                상용구 없음
              </span>
            </button>
          </CoachMark>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-hidden p-4 text-xs text-muted-foreground">
          {guidelineContent ?? (
            <div className="space-y-1.5 opacity-30">
              <div className="h-2.5 w-3/4 rounded bg-muted-foreground" />
              <div className="h-2.5 w-full rounded bg-muted-foreground" />
              <div className="h-2.5 w-5/6 rounded bg-muted-foreground" />
              <div className="h-2.5 w-2/3 rounded bg-muted-foreground" />
              <div className="h-2.5 w-full rounded bg-muted-foreground" />
              <div className="h-2.5 w-4/5 rounded bg-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* 카드 타임라인 + 입력바 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 카드 목록 */}
        <div className="case-input-font-scope flex-1 overflow-y-auto overscroll-y-contain">
          <div className="p-4">
            <CardTimeline cards={inputCards} readOnly />
          </div>
        </div>

        {/* 입력바 — 실제 CardInputBar와 동일한 구조 */}
        <div className="pointer-events-none shrink-0 border-t bg-background">
          {showTimeBanner && (
            <div className="flex items-center gap-1.5 border-b bg-blue-50 px-3 py-1.5 text-xs dark:bg-blue-950">
              <span className="text-muted-foreground">감지된 시간:</span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                어제
              </span>
            </div>
          )}
          <div className="flex items-end gap-2 p-3">
            <CoachMark
              tooltip={getTooltip("camera")}
              tooltipPosition="top"
              active={highlightTarget === "camera"}
            >
              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-none shrink-0"
              >
                <Camera className="size-4" />
              </Button>
            </CoachMark>
            <div className="min-h-[36px] flex-1 overflow-hidden rounded-md border bg-background px-3 py-2 text-sm">
              {inputText}
              {inputText && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground align-middle" />
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="pointer-events-none shrink-0"
              disabled
            >
              <SendHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
