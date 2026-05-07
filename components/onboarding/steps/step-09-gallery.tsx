"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Camera,
  ChevronRight,
  ImagePlus,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachMark } from "@/components/onboarding/coach-mark";
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

const GalleryTooltip = (
  <div className="max-w-[220px] space-y-1.5">
    <p>촬영한 사진 확인 및 추가 업로드가 가능합니다.</p>
    <p className="text-xs font-normal leading-relaxed text-gray-500">
      * 규봇으로 저장한 사진은 편집 없이 바로 EMR에 올려도, 회전되지 않고
      정상적으로 등록됩니다.
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
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCoachMark, setShowCoachMark] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowCoachMark(false);
      setShowDrawer(true);
    }, 1000);
    return () => clearTimeout(t);
  }, []);

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

      {/* 갤러리 FAB */}
      <div className="fixed bottom-6 right-4 z-50">
        <CoachMark
          tooltip={GalleryTooltip}
          tooltipPosition="top"
          active={showCoachMark}
        >
          <button className="pointer-events-none flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Camera className="size-7" />
          </button>
        </CoachMark>
      </div>

      {/* 갤러리 드로어 시뮬레이션 */}
      {showDrawer && (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t bg-background shadow-2xl duration-300 animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h3 className="text-base font-semibold">사진 갤러리</h3>
          </div>

          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 px-5 py-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImagePlus className="size-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              아직 저장된 사진이 없습니다.
            </p>
          </div>

          <div className="space-y-3 border-t px-5 pb-8 pt-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" disabled>
                <Camera className="size-4" />
                카메라
              </Button>
              <Button variant="outline" className="flex-1 gap-2" disabled>
                <ImagePlus className="size-4" />
                갤러리
              </Button>
            </div>
            <StepIndicator total={totalSteps} current={8} />
            <OnboardingNav
              onNext={onComplete}
              onPrev={onPrev}
              nextLabel="완료"
              showPrev
            />
          </div>
        </div>
      )}

      {!showDrawer && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-6 pb-8 pt-3">
          <StepIndicator total={totalSteps} current={8} />
          <OnboardingNav
            onNext={onComplete}
            onPrev={onPrev}
            nextLabel="완료"
            showPrev
          />
        </div>
      )}
    </div>
  );
}
