"use client";

import { Step01Dashboard } from "@/components/onboarding/steps/step-01-dashboard";
import { Step02CaseSetup } from "@/components/onboarding/steps/step-02-case-setup";
import { Step03GuidelineChip } from "@/components/onboarding/steps/step-03-guideline-chip";
import { Step04TemplateChip } from "@/components/onboarding/steps/step-04-template-chip";
import { Step05Input } from "@/components/onboarding/steps/step-05-input";
import { Step06Camera } from "@/components/onboarding/steps/step-06-camera";
import { Step07Recording } from "@/components/onboarding/steps/step-07-recording";
import { Step08Generate } from "@/components/onboarding/steps/step-08-generate";
import { Step09Gallery } from "@/components/onboarding/steps/step-09-gallery";

interface TourStepProps {
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  isPending?: boolean;
}

export function TourStep({
  step,
  totalSteps,
  onNext,
  onPrev,
  onComplete,
  isPending,
}: TourStepProps) {
  const isLast = step === totalSteps;
  const handleNext = isLast ? onComplete : onNext;

  switch (step) {
    case 1:
      return <Step01Dashboard onNext={handleNext} totalSteps={totalSteps} />;
    case 2:
      return (
        <Step02CaseSetup
          onNext={handleNext}
          onPrev={onPrev}
          totalSteps={totalSteps}
        />
      );
    case 3:
      return (
        <Step03GuidelineChip
          onNext={handleNext}
          onPrev={onPrev}
          totalSteps={totalSteps}
        />
      );
    case 4:
      return (
        <Step04TemplateChip
          onNext={handleNext}
          onPrev={onPrev}
          totalSteps={totalSteps}
        />
      );
    case 5:
      return (
        <Step05Input
          onNext={handleNext}
          onPrev={onPrev}
          totalSteps={totalSteps}
        />
      );
    case 6:
      return (
        <Step06Camera
          onNext={handleNext}
          onPrev={onPrev}
          totalSteps={totalSteps}
        />
      );
    case 7:
      return (
        <Step07Recording
          onNext={handleNext}
          onPrev={onPrev}
          totalSteps={totalSteps}
        />
      );
    case 8:
      return (
        <Step08Generate
          onNext={handleNext}
          onPrev={onPrev}
          totalSteps={totalSteps}
        />
      );
    case 9:
      return (
        <Step09Gallery
          onComplete={onComplete}
          onPrev={onPrev}
          totalSteps={totalSteps}
          isPending={isPending}
        />
      );
    default:
      return null;
  }
}
