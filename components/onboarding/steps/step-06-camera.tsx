"use client";

import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

const DEMO_CARDS = [
  { text: "어제 통증 시작", timeTag: "어제" },
  { text: "LLQ" },
];

interface Step06Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

export function Step06Camera({ onNext, onPrev, totalSteps }: Step06Props) {
  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm
        cards={DEMO_CARDS}
        highlightTarget="camera"
        highlightTooltip="카메라 버튼으로 문진 중 사진을 촬영할 수 있습니다."
      />
      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <StepIndicator total={totalSteps} current={5} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
