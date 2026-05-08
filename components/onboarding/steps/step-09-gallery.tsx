"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Camera,
  ChevronRight,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { MockCaseForm } from "@/components/onboarding/mock-case-form";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";
import { StatusBoardCard } from "@/components/cases/status-board-card";
import type { BedZone, Case } from "@/lib/supabase/types";

const NOW = new Date().toISOString();

const MOCK_CASES: Case[] = [
  {
    id: "mock-g1",
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
    id: "mock-g2",
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
    id: "mock-g3",
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

const DEMO_CARDS = [
  { text: "어제 통증 시작", timeTag: "어제" },
  { text: "LLQ" },
  { text: "npo 고형 11시 액체 13시" },
];

const GalleryTooltip = (
  <div className="max-w-[220px] space-y-1.5">
    <p>촬영한 사진 확인 및 추가 업로드가 가능합니다.</p>
    <p className="text-xs font-normal leading-relaxed text-gray-500">
      규봇으로 저장한 사진은 편집 없이 바로 EMR에 올려도, 사진이 돌아가지 않고
      정상적으로 올라갑니다.
    </p>
  </div>
);

interface Step09Props {
  onComplete: () => void;
  onPrev: () => void;
  totalSteps: number;
  isPending?: boolean;
}

export function Step09Gallery({
  onComplete,
  onPrev,
  totalSteps,
  isPending: _isPending,
}: Step09Props) {
  const [phase, setPhase] = useState<"form" | "dashboard">("form");

  useEffect(() => {
    const t = setTimeout(() => setPhase("dashboard"), 2500);
    return () => clearTimeout(t);
  }, []);

  if (phase === "form") {
    return (
      <div className="relative flex h-screen flex-col">
        <MockCaseForm
          cards={DEMO_CARDS}
          highlightTarget="back"
          highlightTooltip="케이스 작성 후 뒤로가기를 눌러 대시보드로 돌아갑니다."
        />
      </div>
    );
  }

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
          <Button size="sm" className="pointer-events-none gap-1 opacity-50">
            <Plus className="size-4" />
            환자 추가
          </Button>
        </div>
      </div>

      {/* 현황판 — 실제 StatusBoardCard 사용 */}
      <main className="flex-1 space-y-4 overflow-y-auto p-3 pb-32">
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

      {/* 갤러리 FAB — CoachMark 항상 활성, 드로어 열리지 않음 */}
      <div className="fixed bottom-28 right-4 z-50">
        <CoachMark tooltip={GalleryTooltip} tooltipPosition="top" active={true}>
          <button className="pointer-events-none flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Camera className="size-7" />
          </button>
        </CoachMark>
      </div>

      {/* 하단 네비게이션 항상 표시 */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
        <StepIndicator total={totalSteps} current={8} />
        <OnboardingNav
          onNext={onComplete}
          onPrev={onPrev}
          nextLabel="완료"
          showPrev
        />
      </div>
    </div>
  );
}
