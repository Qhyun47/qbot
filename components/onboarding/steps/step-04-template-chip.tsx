"use client";

import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

interface Step04Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

export function Step04TemplateChip({
  onNext,
  onPrev,
  totalSteps,
}: Step04Props) {
  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm
        highlightTarget="template-tab"
        highlightTooltip="상용구 탭을 눌러 차팅 템플릿을 불러오고 다중 선택할 수 있습니다."
      />
      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <StepIndicator total={totalSteps} current={3} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
