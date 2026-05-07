"use client";

import { useEffect, useState } from "react";
import { Camera, ImagePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

const PLACEHOLDER_CARDS = [
  { zone: "A", bed: "01", cc: "Chest pain" },
  { zone: "A", bed: "03", cc: "Dyspnea" },
  { zone: "B", bed: "02", cc: "Abdominal pain" },
];

const GalleryTooltip = (
  <div className="max-w-[220px] space-y-1.5">
    <p>촬영한 사진 확인 및 추가 업로드가 가능합니다.</p>
    <p className="text-xs font-normal leading-relaxed text-gray-500">
      * 규봇으로 저장한 사진은 편집 없이 바로 EMR에 올려도, 회전되지 않고
      정상적으로 등록됩니다.
    </p>
  </div>
);

interface Step09Props {
  onComplete: () => void;
  onPrev: () => void;
  totalSteps: number;
  isPending?: boolean;
}

export function Step09Gallery({
  onComplete,
  onPrev,
  totalSteps,
  isPending: _isPending,
}: Step09Props) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCoachMark, setShowCoachMark] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowCoachMark(false);
      setShowDrawer(true);
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 목업 헤더 */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-bold">규봇</span>
        <Button
          size="sm"
          className="pointer-events-none gap-1 opacity-50"
          disabled
        >
          <Plus className="size-4" />
          환자 추가
        </Button>
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

      {/* 갤러리 FAB */}
      <div className="fixed bottom-6 right-4 z-50">
        <CoachMark
          tooltip={GalleryTooltip}
          tooltipPosition="top"
          active={showCoachMark}
        >
          <button className="pointer-events-none flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Camera className="size-7" />
          </button>
        </CoachMark>
      </div>

      {/* 갤러리 드로어 시뮬레이션 */}
      {showDrawer && (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t bg-background shadow-2xl duration-300 animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h3 className="text-base font-semibold">사진 갤러리</h3>
          </div>

          {/* 빈 사진 영역 */}
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 px-5 py-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImagePlus className="size-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              아직 저장된 사진이 없습니다.
            </p>
          </div>

          {/* 하단 버튼 + 네비 */}
          <div className="space-y-3 border-t px-5 pb-8 pt-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" disabled>
                <Camera className="size-4" />
                카메라
              </Button>
              <Button variant="outline" className="flex-1 gap-2" disabled>
                <ImagePlus className="size-4" />
                갤러리
              </Button>
            </div>
            <StepIndicator total={totalSteps} current={8} />
            <OnboardingNav
              onNext={onComplete}
              onPrev={onPrev}
              nextLabel="완료"
              showPrev
            />
          </div>
        </div>
      )}

      {/* 드로어 표시 전 하단 네비 */}
      {!showDrawer && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
          <StepIndicator total={totalSteps} current={8} />
          <OnboardingNav
            onNext={onComplete}
            onPrev={onPrev}
            nextLabel="완료"
            showPrev
          />
        </div>
      )}
    </div>
  );
}
