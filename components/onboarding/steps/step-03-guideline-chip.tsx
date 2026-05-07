"use client";

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
  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm
        highlightTarget="guideline-tab"
        highlightTooltip="가이드라인 탭을 눌러 가이드라인을 확인하고 변경할 수 있습니다."
      />
      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <StepIndicator total={totalSteps} current={2} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
