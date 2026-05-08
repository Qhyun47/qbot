"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface OnboardingNavProps {
  onNext: () => void;
  onPrev?: () => void;
  nextLabel?: string;
  showPrev?: boolean;
  isPending?: boolean;
}

export function OnboardingNav({
  onNext,
  onPrev,
  nextLabel = "다음",
  showPrev = false,
  isPending,
}: OnboardingNavProps) {
  return (
    <div className="flex w-full items-center justify-between pt-4">
      <div>
        {showPrev && onPrev && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={isPending}
            className="text-muted-foreground"
          >
            <ChevronLeft className="mr-1 size-4" />
            이전
          </Button>
        )}
      </div>
      <Button onClick={onNext} size="sm" className="gap-1" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {nextLabel}
            {nextLabel === "다음" && <ChevronRight className="size-4" />}
          </>
        )}
      </Button>
    </div>
  );
}
