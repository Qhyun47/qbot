"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

export function ConditionalHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isInputView =
    pathname === "/cases/new" ||
    (!!pathname.match(/^\/cases\/[^/]+$/) &&
      searchParams.get("view") !== "result");

  if (isInputView) return null;
  return <>{children}</>;
}
