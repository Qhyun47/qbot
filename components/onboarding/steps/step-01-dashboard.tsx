"use client";

import { Bell, ChevronRight, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
import type { BedZone, CaseStatus } from "@/lib/supabase/types";

interface Step01Props {
  onNext: () => void;
  totalSteps: number;
}

const MOCK_ZONES: {
  zone: BedZone;
  cases: { bed: number; cc: string; status: CaseStatus; time: string }[];
}[] = [
  {
    zone: "A",
    cases: [
      { bed: 1, cc: "Chest pain", status: "draft", time: "00:21" },
      { bed: 3, cc: "Dyspnea", status: "completed", time: "01:05" },
    ],
  },
  {
    zone: "R",
    cases: [{ bed: 2, cc: "Abdominal pain", status: "draft", time: "00:48" }],
  },
];

const ZONE_LABELS: Record<BedZone, string> = {
  A: "A구역",
  B: "B구역",
  R: "R구역",
};

export function Step01Dashboard({ onNext, totalSteps }: Step01Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 컨트롤 바 */}
      <div className="pointer-events-none flex flex-wrap items-center gap-y-1.5 border-b px-3 py-2">
        <div className="flex shrink-0 items-center gap-1">
          <button className="rounded border px-2 py-1 text-xs font-medium">
            일반
          </button>
          <button className="rounded px-2 py-1 text-xs text-muted-foreground">
            간편
          </button>
          <div className="mx-1.5 h-4 w-px bg-border/60" />
          <button className="rounded p-1 text-muted-foreground">
            <RefreshCw className="size-3.5" />
          </button>
          <button className="rounded p-1 text-muted-foreground">
            <Trash2 className="size-3.5" />
          </button>
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            전체 보기 <ChevronRight className="size-3" />
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button size="sm" variant="outline" className="gap-1 opacity-50">
            <Bell className="size-3.5" />
            알람 추가
          </Button>
          <Button size="sm" variant="outline" className="opacity-50">
            의약품 정리
          </Button>
          <CoachMark
            tooltip="환자 추가를 눌러 문진을 시작합니다."
            tooltipPosition="left"
            active
          >
            <Button size="sm" className="pointer-events-none gap-1">
              <Plus className="size-4" />
              환자 추가
            </Button>
          </CoachMark>
        </div>
      </div>

      {/* 현황판 */}
      <main className="flex-1 space-y-4 overflow-y-auto p-3">
        {MOCK_ZONES.map(({ zone, cases }) => (
          <div key={zone} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {ZONE_LABELS[zone]}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {cases.map((c) => (
                <div
                  key={`${zone}${c.bed}`}
                  className="pointer-events-none flex flex-col gap-2 rounded-lg border bg-card p-3 opacity-40"
                >
                  <div className="flex items-center justify-between">
                    <BedBadge bedZone={zone} bedNumber={c.bed} size="sm" />
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium leading-snug">
                      {c.cc}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground/70">
                      {c.time}
                    </span>
                  </div>
                  <div className="h-8 rounded-md border bg-background/50" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/50">
                      노티 —
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* 하단 네비 */}
      <div className="relative z-50 px-6 pb-8 pt-4">
        <StepIndicator total={totalSteps} current={0} />
        <OnboardingNav onNext={onNext} nextLabel="다음" />
      </div>
    </div>
  );
}
