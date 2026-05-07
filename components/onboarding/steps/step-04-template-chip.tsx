"use client";

import { useEffect, useState } from "react";
import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

interface Step04Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

const TEMPLATES = ["복통 기본", "복통 외상", "복통 부인과"];

export function Step04TemplateChip({
  onNext,
  onPrev,
  totalSteps,
}: Step04Props) {
  const [showSheet, setShowSheet] = useState(false);
  const [selected, setSelected] = useState<string[]>(["복통 기본"]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSheet(true), 1500);
    const t2 = setTimeout(() => {
      setSelected((prev) =>
        prev.includes("복통 외상") ? prev : [...prev, "복통 외상"]
      );
    }, 2000);
    const t3 = setTimeout(() => setShowSheet(false), 3000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div className="relative flex h-screen flex-col">
      <MockCaseForm
        activeTab="상용구"
        highlightTarget="template-tab"
        highlightTooltip="상용구 칩을 탭하면 활성화, 한 번 더 탭하면 변경·다중 선택이 가능합니다."
      />

      {/* 상용구 변경/다중 선택 시트 목업 */}
      {showSheet && (
        <div className="absolute inset-x-0 bottom-20 z-50 mx-4 rounded-xl border bg-background p-4 shadow-xl duration-200 animate-in slide-in-from-bottom">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            상용구 선택
          </p>
          <div className="space-y-1">
            {TEMPLATES.map((item) => (
              <div
                key={item}
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  selected.includes(item)
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item}
                {selected.includes(item) && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            여러 상용구를 동시에 선택할 수 있습니다.
          </p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <StepIndicator total={totalSteps} current={3} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
