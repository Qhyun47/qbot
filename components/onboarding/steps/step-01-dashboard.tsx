"use client";

import { Bell, ChevronRight, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";
import { StatusBoardCard } from "@/components/cases/status-board-card";
import type { BedZone, Case } from "@/lib/supabase/types";

interface Step01Props {
  onNext: () => void;
  totalSteps: number;
}

const NOW = new Date().toISOString();

const MOCK_CASES: Case[] = [
  {
    id: "mock-1",
    bed_zone: "A" as BedZone,
    bed_number: 1,
    bed_explicitly_set: true,
    cc: "Chest pain",
    ccs: ["Chest pain"],
    status: "draft",
    created_at: new Date(Date.now() - 21 * 60000).toISOString(),
    memo: null,
    notify_status: null,
    cc_has_template: false,
    template_key: null,
    template_keys: [],
    has_inputs: false,
    current_result_id: null,
    board_hidden_at: null,
    updated_at: NOW,
    user_id: "mock-user",
  },
  {
    id: "mock-2",
    bed_zone: "A" as BedZone,
    bed_number: 3,
    bed_explicitly_set: true,
    cc: "Dyspnea",
    ccs: ["Dyspnea"],
    status: "completed",
    created_at: new Date(Date.now() - 65 * 60000).toISOString(),
    memo: null,
    notify_status: "완료",
    cc_has_template: false,
    template_key: null,
    template_keys: [],
    has_inputs: true,
    current_result_id: "mock-result",
    board_hidden_at: null,
    updated_at: NOW,
    user_id: "mock-user",
  },
  {
    id: "mock-3",
    bed_zone: "R" as BedZone,
    bed_number: 2,
    bed_explicitly_set: true,
    cc: "Abdominal pain",
    ccs: ["Abdominal pain"],
    status: "draft",
    created_at: new Date(Date.now() - 48 * 60000).toISOString(),
    memo: null,
    notify_status: null,
    cc_has_template: true,
    template_key: "abdominal-pain",
    template_keys: ["abdominal-pain"],
    has_inputs: false,
    current_result_id: null,
    board_hidden_at: null,
    updated_at: NOW,
    user_id: "mock-user",
  },
];

const GROUPED: { zone: BedZone; label: string; cases: Case[] }[] = [
  {
    zone: "A",
    label: "A구역",
    cases: MOCK_CASES.filter((c) => c.bed_zone === "A"),
  },
  {
    zone: "R",
    label: "R구역",
    cases: MOCK_CASES.filter((c) => c.bed_zone === "R"),
  },
];

export function Step01Dashboard({ onNext, totalSteps }: Step01Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 컨트롤 바 — 실제 대시보드와 동일한 구조 */}
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
            <Button
              size="sm"
              className="pointer-events-auto cursor-pointer gap-1"
              onClick={onNext}
            >
              <Plus className="size-4" />
              환자 추가
            </Button>
          </CoachMark>
        </div>
      </div>

      {/* 현황판 — 실제 StatusBoardCard 사용 */}
      <main className="flex-1 space-y-4 overflow-y-auto p-3">
        {GROUPED.map(({ zone, label, cases }) => (
          <div key={zone} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {cases.map((c) => (
                <div key={c.id} className="pointer-events-none opacity-40">
                  <StatusBoardCard case={c} />
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
