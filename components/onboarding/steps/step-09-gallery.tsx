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
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
import type { BedZone, CaseStatus } from "@/lib/supabase/types";

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

          {/* 빈 사진 영역 */}
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 px-5 py-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImagePlus className="size-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              아직 저장된 사진이 없습니다.
            </p>
          </div>

          {/* 하단 버튼 + 네비 */}
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

      {/* 드로어 표시 전 하단 네비 */}
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
