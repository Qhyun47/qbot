"use client";

import { ArrowLeft, Camera, Mic, SendHorizontal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";

export type MockTab = "가이드라인" | "상용구";
export type HighlightTarget =
  | "guideline-tab"
  | "template-tab"
  | "mic"
  | "zap"
  | "camera"
  | "gallery"
  | null;

interface MockCard {
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
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* 헤더 */}
      <header className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-none size-8"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            A01
          </span>
          <span className="truncate rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
            Abdominal pain
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
            <Button size="sm" className="pointer-events-none h-7 gap-1 text-xs">
              <Zap className="size-3" />
              차팅 생성
            </Button>
          </CoachMark>
        </div>
      </header>

      {/* 가이드라인 패널 */}
      <div className="flex flex-col border-b" style={{ height: "45%" }}>
        {/* 탭 */}
        <div className="flex shrink-0 items-center gap-1 px-3 pb-1 pt-2">
          <CoachMark
            tooltip={getTooltip("guideline-tab")}
            tooltipPosition="bottom"
            active={highlightTarget === "guideline-tab"}
          >
            <button
              className={`pointer-events-none rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "가이드라인"
                  ? "bg-primary text-primary-foreground"
                  : "border text-muted-foreground"
              }`}
            >
              가이드라인
            </button>
          </CoachMark>
          <CoachMark
            tooltip={getTooltip("template-tab")}
            tooltipPosition="bottom"
            active={highlightTarget === "template-tab"}
          >
            <button
              className={`pointer-events-none rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "상용구"
                  ? "bg-primary text-primary-foreground"
                  : "border text-muted-foreground"
              }`}
            >
              상용구
            </button>
          </CoachMark>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-hidden px-3 py-2 text-xs text-muted-foreground">
          {guidelineContent ?? (
            <div className="space-y-1.5 opacity-40">
              {activeTab === "가이드라인" ? (
                <>
                  <div className="h-2.5 w-3/4 rounded bg-muted" />
                  <div className="h-2.5 w-full rounded bg-muted" />
                  <div className="h-2.5 w-5/6 rounded bg-muted" />
                  <div className="h-2.5 w-2/3 rounded bg-muted" />
                  <div className="h-2.5 w-full rounded bg-muted" />
                  <div className="h-2.5 w-4/5 rounded bg-muted" />
                </>
              ) : (
                <>
                  <div className="h-2.5 w-1/2 rounded bg-muted" />
                  <div className="h-2.5 w-full rounded bg-muted" />
                  <div className="h-2.5 w-3/4 rounded bg-muted" />
                  <div className="h-2.5 w-5/6 rounded bg-muted" />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 카드 타임라인 + 입력바 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 시간 감지 배너 */}
        {showTimeBanner && (
          <div className="mx-3 mt-2 shrink-0 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400">
            감지된 시간: 어제
          </div>
        )}

        {/* 카드 목록 */}
        <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
          {cards.map((card, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card px-3 py-2 text-sm"
            >
              {card.timeTag && (
                <span className="mr-1.5 text-xs text-blue-500">
                  {card.timeTag}
                </span>
              )}
              {card.text}
            </div>
          ))}
        </div>

        {/* 입력바 */}
        <div className="shrink-0 border-t px-3 pb-4 pt-2">
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2">
            <CoachMark
              tooltip={getTooltip("camera")}
              tooltipPosition="top"
              active={highlightTarget === "camera"}
            >
              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-none size-7 shrink-0"
              >
                <Camera className="size-4" />
              </Button>
            </CoachMark>
            <div className="min-h-5 flex-1 text-sm">
              {inputText}
              {inputText && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground align-middle" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="pointer-events-none size-7 shrink-0"
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
