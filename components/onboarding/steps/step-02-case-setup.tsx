"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BedPicker } from "@/components/cases/bed-picker";
import { MultiCcInput } from "@/components/cases/multi-cc-input";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";
import type { BedZone } from "@/lib/supabase/types";

interface Step02Props {
  onNext: () => void;
  onPrev: () => void;
  totalSteps: number;
}

export function Step02CaseSetup({ onNext, onPrev, totalSteps }: Step02Props) {
  const [bedZone] = useState<BedZone>("A");
  const [bedNumber, setBedNumber] = useState<number | null>(null);
  const [ccs, setCcs] = useState<string[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setBedNumber(1), 600);
    const t2 = setTimeout(() => setCcs(["Abdominal pain"]), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 실제 NewCaseForm 설정 화면 헤더와 동일 */}
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-none shrink-0"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <span className="flex-1 text-sm font-semibold">환자 추가</span>
        <Button
          variant="ghost"
          size="sm"
          className="pointer-events-none text-muted-foreground"
        >
          건너뛰기
        </Button>
      </header>

      {/* 실제 NewCaseForm 설정 화면 콘텐츠와 동일 */}
      <div className="pointer-events-none flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <BedPicker
          bedZone={bedZone}
          bedNumber={bedNumber}
          onChange={() => {}}
        />
        <Separator />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            C.C (Chief Complaint)
          </label>
          <MultiCcInput values={ccs} onChange={() => {}} />
        </div>
      </div>

      {/* 실제 "확인" 버튼 자리를 온보딩 네비로 대체 */}
      <div className="shrink-0 space-y-3 border-t p-4">
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          베드 번호와 C.C(주요 증상)를 선택하면 케이스가 생성됩니다.
        </p>
        <StepIndicator total={totalSteps} current={1} />
        <OnboardingNav onNext={onNext} onPrev={onPrev} showPrev />
      </div>
    </div>
  );
}
