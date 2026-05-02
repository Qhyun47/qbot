"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCompactMode } from "@/components/compact-mode-provider";
import type { ReactNode } from "react";

export function ConditionalHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCompact } = useCompactMode();

  const isInputView =
    pathname === "/cases/new" ||
    (!!pathname.match(/^\/cases\/[^/]+$/) &&
      searchParams.get("view") !== "result");

  if (isInputView || isCompact) return null;
  return <>{children}</>;
}
