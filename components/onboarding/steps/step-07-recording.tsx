"use client";

import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

const DEMO_CARDS = [
  { text: "어제 통증 시작", timeTag: "어제" },
  { text: "LLQ" },
];

const RecordingTooltip = (
  <div className="space-y-1.5">
    <p>
      녹음 버튼으로 음성을 녹음할 수 있습니다. 텍스트로 변환되어 나중에 확인
      가능합니다.
    </p>
    <p className="text-xs font-normal text-gray-500">
      * 설정에서 자동 녹음을 켜면 문진 시작 시 자동으로 녹음됩니다.
    </p>
  </div>
);

interface Step07Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

export function Step07Recording({ onNext, onPrev, totalSteps }: Step07Props) {
  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm
        cards={DEMO_CARDS}
        highlightTarget="mic"
        tooltipNode={RecordingTooltip}
      />
      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <StepIndicator total={totalSteps} current={6} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
