"use client";

import { cn } from "@/lib/utils";
import { useCompactMode } from "@/components/compact-mode-provider";

export function CompactModeToggle({ className }: { className?: string }) {
  const { isCompact, setIsCompact } = useCompactMode();

  return (
    <div
      role="group"
      aria-label="보기 모드 선택"
      className={cn(
        "inline-flex rounded-md border bg-muted p-0.5 text-xs font-medium",
        className
      )}
    >
      <button
        onClick={() => setIsCompact(false)}
        aria-pressed={!isCompact}
        className={cn(
          "rounded px-2.5 py-1 transition-colors",
          !isCompact
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        일반
      </button>
      <button
        onClick={() => setIsCompact(true)}
        aria-pressed={isCompact}
        className={cn(
          "rounded px-2.5 py-1 transition-colors",
          isCompact
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        간편
      </button>
    </div>
  );
}
