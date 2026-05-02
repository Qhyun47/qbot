"use client";

import { useCompactMode } from "@/components/compact-mode-provider";
import type { ReactNode } from "react";

export function DashboardPageShell({ children }: { children: ReactNode }) {
  const { isCompact } = useCompactMode();

  if (isCompact) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    );
  }

  return <div className="flex flex-col gap-8 p-4 xl:p-8">{children}</div>;
}
