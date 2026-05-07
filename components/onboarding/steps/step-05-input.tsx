"use client";

import { useEffect, useState } from "react";
import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";
import { useAutoType } from "@/hooks/use-auto-type";

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
  const [showTimeBanner, setShowTimeBanner] = useState(false);
  const [phase, setPhase] = useState<"first" | "second" | "done">("first");
  const [inputText, setInputText] = useState("");

  // 1차 타이핑: '어제 통증 시작'
  const { displayLines: lines1, isDone: done1 } = useAutoType(
    phase === "first" ? ["어제 통증 시작"] : [],
    { charDelay: 60 }
  );

  // 2차 타이핑: 'LLQ'
  const { displayLines: lines2, isDone: done2 } = useAutoType(
    phase === "second" ? ["LLQ"] : [],
    { charDelay: 80, startDelay: 500 }
  );

  // 1차 타이핑 → 시간 배너 → 카드 추가 → 2차 타이핑
  useEffect(() => {
    if (phase !== "first") return;
    setInputText(lines1[0] ?? "");
  }, [lines1, phase]);

  useEffect(() => {
    if (!done1 || phase !== "first") return;
    const t1 = setTimeout(() => setShowTimeBanner(true), 500);
    const t2 = setTimeout(() => {
      setCards([{ text: "어제 통증 시작", timeTag: "어제" }]);
      setInputText("");
      setShowTimeBanner(false);
      setPhase("second");
    }, 1500);
    return () => [t1, t2].forEach(clearTimeout);
  }, [done1, phase]);

  useEffect(() => {
    if (phase !== "second") return;
    setInputText(lines2[0] ?? "");
  }, [lines2, phase]);

  useEffect(() => {
    if (!done2 || phase !== "second") return;
    const t = setTimeout(() => {
      setCards((prev) => [...prev, { text: "LLQ" }]);
      setInputText("");
      setPhase("done");
    }, 500);
    return () => clearTimeout(t);
  }, [done2, phase]);

  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm
        activeTab="가이드라인"
        cards={cards}
        inputText={inputText}
        showTimeBanner={showTimeBanner}
      />

      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <p className="mb-2 text-center text-xs leading-relaxed text-muted-foreground">
          문진 정보를 입력하면 대화 형태로 저장됩니다.
          <br />
          <span className="font-medium text-foreground">
            &apos;어제&apos;
          </span>,{" "}
          <span className="font-medium text-foreground">
            &apos;3일 전&apos;
          </span>{" "}
          같은 표현은 자동으로 감지됩니다.
        </p>
        <StepIndicator total={totalSteps} current={4} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
