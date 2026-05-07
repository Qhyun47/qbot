"use client";

import { useEffect, useState } from "react";
import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

interface Step03Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

export function Step03GuidelineChip({
  onNext,
  onPrev,
  totalSteps,
}: Step03Props) {
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSheet(true), 1500);
    const t2 = setTimeout(() => setShowSheet(false), 2800);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);

  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm
        activeTab="가이드라인"
        highlightTarget="guideline-tab"
        highlightTooltip="가이드라인 칩을 눌러 가이드라인을 변경할 수 있습니다."
      />

      {/* 가이드라인 변경 시트 목업 */}
      {showSheet && (
        <div className="absolute inset-x-0 bottom-20 z-50 mx-4 rounded-xl border bg-background p-4 shadow-xl duration-200 animate-in slide-in-from-bottom">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            가이드라인 변경
          </p>
          <div className="space-y-1">
            {["Abdominal pain", "Chest pain", "Dyspnea"].map((item) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-1.5 text-sm ${item === "Abdominal pain" ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <StepIndicator total={totalSteps} current={2} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
