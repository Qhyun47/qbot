"use client";

import { useCompactMode } from "@/components/compact-mode-provider";
import type { ReactNode } from "react";

export function CompactHide({ children }: { children: ReactNode }) {
  const { isCompact } = useCompactMode();
  if (isCompact) return null;
  return <>{children}</>;
}
