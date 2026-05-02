"use client";

import { cn } from "@/lib/utils";
import { useScreenGuard } from "@/hooks/use-screen-guard";

export function ScreenGuard() {
  const { isActive, dismiss } = useScreenGuard();

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] bg-background/20 backdrop-blur-md",
        "transition-opacity",
        isActive
          ? "opacity-100 duration-1000"
          : "pointer-events-none opacity-0 duration-150"
      )}
      onClick={dismiss}
      onKeyDown={dismiss}
      tabIndex={-1}
    />
  );
}
