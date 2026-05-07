"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";
import { useAutoType } from "@/hooks/use-auto-type";

const ZONES = ["A", "B", "R"] as const;
const BEDS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

interface Step02Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

export function Step02CaseSetup({ onNext, onPrev, totalSteps }: Step02Props) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<string | null>(null);
  const [showBeds, setShowBeds] = useState(false);
  const [ccConfirmed, setCcConfirmed] = useState(false);

  const { displayLines, isDone: typingDone } = useAutoType(["Abdominal pain"], {
    startDelay: 1200,
    charDelay: 50,
  });

  useEffect(() => {
    const t1 = setTimeout(() => setSelectedZone("A"), 300);
    const t2 = setTimeout(() => setShowBeds(true), 700);
    const t3 = setTimeout(() => setSelectedBed("01"), 900);
    const t4 = setTimeout(() => setCcConfirmed(true), 2500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const ccText = displayLines[0] ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 흐릿한 대시보드 배경 */}
      <div className="pointer-events-none absolute inset-0 select-none opacity-20">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-lg font-bold">규봇</span>
          <Button size="sm" className="gap-1" disabled>
            <Plus className="size-4" />
            환자 추가
          </Button>
        </header>
      </div>

      {/* 슬라이드업 오버레이 */}
      <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl border-t bg-background shadow-2xl duration-300 animate-in slide-in-from-bottom">
        <div className="px-5 pb-2 pt-5">
          <h2 className="text-base font-semibold">환자 추가</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            베드 번호와 C.C.를 선택합니다.
          </p>
        </div>

        <div className="space-y-4 px-5 py-3">
          {/* 구역 선택 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">구역</p>
            <div className="flex gap-2">
              {ZONES.map((z) => (
                <button
                  key={z}
                  className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedZone === z
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {z}구역
                </button>
              ))}
            </div>
          </div>

          {/* 베드 그리드 */}
          {showBeds && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">베드</p>
              <div className="grid grid-cols-6 gap-1.5">
                {BEDS.map((b) => (
                  <button
                    key={b}
                    className={`rounded-lg border py-1.5 font-mono text-sm transition-colors ${
                      selectedBed === b
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CC 입력 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">C.C.</p>
            {ccConfirmed ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  Abdominal pain
                </span>
              </div>
            ) : (
              <div className="flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <span>{ccText}</span>
                {!typingDone && (
                  <span className="inline-block h-4 w-0.5 animate-pulse bg-foreground" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* 네비 */}
        <div className="px-5 pb-8 pt-2">
          <StepIndicator total={totalSteps} current={1} />
          <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
        </div>
      </div>
    </div>
  );
}
