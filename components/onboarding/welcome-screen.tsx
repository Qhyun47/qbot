"use client";

import { Loader2 } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onSkip: () => void;
  onStart: () => void;
  isPending?: boolean;
}

export function WelcomeScreen({
  onSkip,
  onStart,
  isPending,
}: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center">
      <Logo className="size-20 text-foreground" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">규봇 사용 가이드</h1>
        <p className="text-sm text-muted-foreground">
          핵심 기능을 빠르게 안내해 드립니다.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button onClick={onStart} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          시작하기
        </Button>
        <Button variant="ghost" onClick={onSkip} disabled={isPending}>
          건너뛰기
        </Button>
      </div>
    </div>
  );
}
