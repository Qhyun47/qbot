"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

interface Step01Props {
  onNext: () => void;
  totalSteps: number;
}

const PLACEHOLDER_CARDS = [
  { zone: "A", bed: "01", cc: "Chest pain" },
  { zone: "A", bed: "03", cc: "Dyspnea" },
  { zone: "B", bed: "02", cc: "Abdominal pain" },
];

export function Step01Dashboard({ onNext, totalSteps }: Step01Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 목업 헤더 */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-bold">규봇</span>
        <CoachMark
          tooltip="환자 추가를 눌러 문진을 시작합니다."
          tooltipPosition="left"
          active
        >
          <Button size="sm" className="pointer-events-none gap-1">
            <Plus className="size-4" />
            환자 추가
          </Button>
        </CoachMark>
      </header>

      {/* 목업 보드 */}
      <main className="flex-1 space-y-2 overflow-hidden p-4">
        {PLACEHOLDER_CARDS.map((card) => (
          <div
            key={`${card.zone}${card.bed}`}
            className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 opacity-40"
          >
            <div className="flex items-center gap-3">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {card.zone}
                {card.bed}
              </span>
              <span className="text-sm text-muted-foreground">{card.cc}</span>
            </div>
            <div className="size-2 rounded-full bg-muted-foreground/30" />
          </div>
        ))}
      </main>

      {/* 하단 네비 */}
      <div className="relative z-50 px-6 pb-8 pt-4">
        <StepIndicator total={totalSteps} current={0} />
        <OnboardingNav onNext={onNext} nextLabel="다음" />
      </div>
    </div>
  );
}
