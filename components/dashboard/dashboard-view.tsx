"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCompactMode } from "@/components/compact-mode-provider";
import { CompactModeToggle } from "@/components/dashboard/compact-mode-toggle";
import { CompactStatusList } from "@/components/dashboard/compact-status-list";
import { StatusBoard } from "@/components/cases/status-board";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { HideAllFromBoardButton } from "@/components/cases/hide-all-from-board-button";
import type { Case } from "@/lib/supabase/types";

interface DashboardViewProps {
  cases: Case[];
}

export function DashboardView({ cases }: DashboardViewProps) {
  const { isCompact } = useCompactMode();

  if (isCompact) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-end border-b px-3 py-2">
          <CompactModeToggle />
        </div>
        <div className="flex-1 overflow-y-auto">
          <CompactStatusList cases={cases} />
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-y-1">
        <h2 className="shrink-0 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          현황판
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <RefreshButton />
          <HideAllFromBoardButton />
          <CompactModeToggle />
          <Link
            href="/cases"
            className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            전체 보기
            <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>
      <StatusBoard cases={cases} />
    </section>
  );
}
