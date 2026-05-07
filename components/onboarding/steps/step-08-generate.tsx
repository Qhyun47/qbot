"use client";

import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

const DEMO_CARDS = [
  { text: "어제 통증 시작", timeTag: "어제" },
  { text: "LLQ" },
];

const GenerateTooltip = (
  <div className="space-y-1.5">
    <p>차팅 생성을 누르면 문진 내용이 상용구에 자동으로 채워집니다.</p>
    <p className="text-xs font-normal text-gray-500">
      * 뒤로가기로 나가면 AI 차팅 없이 저장되며, 개발자 지갑도 지켜집니다.
    </p>
  </div>
);

interface Step08Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

export function Step08Generate({ onNext, onPrev, totalSteps }: Step08Props) {
  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm
        cards={DEMO_CARDS}
        highlightTarget="zap"
        tooltipNode={GenerateTooltip}
      />
      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <StepIndicator total={totalSteps} current={7} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
