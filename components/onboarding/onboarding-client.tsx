"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { completeOnboarding } from "@/lib/onboarding/actions";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { TourStep } from "@/components/onboarding/tour-step";

const TOTAL_STEPS = 9;

export function OnboardingClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);

  const finish = () => {
    startTransition(async () => {
      await completeOnboarding();
      router.push("/dashboard");
      toast("설정에서 이 가이드를 다시 볼 수 있습니다.");
    });
  };

  const content =
    step === 0 ? (
      <WelcomeScreen
        onSkip={finish}
        onStart={() => setStep(1)}
        isPending={isPending}
      />
    ) : (
      <TourStep
        step={step}
        totalSteps={TOTAL_STEPS}
        onNext={() => {
          if (step < TOTAL_STEPS) {
            setStep((s) => s + 1);
          } else {
            finish();
          }
        }}
        onPrev={() => setStep((s) => Math.max(1, s - 1))}
        onComplete={finish}
        isPending={isPending}
      />
    );

  return (
    <>
      <div className="flex flex-1 flex-col md:hidden">{content}</div>
      <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-8 text-center md:flex">
        <p className="text-base font-medium">모바일 기기에서 이용해주세요.</p>
        <p className="text-sm text-muted-foreground">
          규봇 사용 가이드는 모바일 환경에서만 동작합니다.
        </p>
      </div>
    </>
  );
}
