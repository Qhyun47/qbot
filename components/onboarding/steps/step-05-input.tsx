"use client";

import { useEffect, useState } from "react";
import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

interface Step05Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

interface MockCard {
  text: string;
  timeTag?: string;
}

export function Step05Input({ onNext, onPrev, totalSteps }: Step05Props) {
  const [cards, setCards] = useState<MockCard[]>([]);

  useEffect(() => {
    const t1 = setTimeout(
      () => setCards([{ text: "어제 통증 시작", timeTag: "어제" }]),
      800
    );
    const t2 = setTimeout(
      () => setCards((prev) => [...prev, { text: "LLQ" }]),
      1800
    );
    const t3 = setTimeout(
      () => setCards((prev) => [...prev, { text: "npo 고형 11시 액체 13시" }]),
      2800
    );
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm cards={cards} />

      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <p className="rounded-lg border bg-muted/60 px-3 py-2 text-center text-sm leading-relaxed text-foreground">
          문진 정보를 입력하면 대화 형태로 저장됩니다.
          <br />
          <span className="font-medium">&apos;어제&apos;</span>,{" "}
          <span className="font-medium">&apos;3일 전&apos;</span> 같은 표현은
          자동으로 감지됩니다.
        </p>
        <StepIndicator total={totalSteps} current={4} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
