"use client";

import { BedBadge } from "@/components/cases/bed-badge";
import { cn } from "@/lib/utils";
import { BED_NUMBERS_BY_ZONE } from "@/lib/cases/bed-config";
import type { BedZone } from "@/lib/supabase/types";

interface BedPickerProps {
  bedZone: BedZone;
  bedNumber: number | null;
  onChange: (zone: BedZone, number: number | null) => void;
}

const ZONES: BedZone[] = ["A", "B", "R"];

export function BedPicker({ bedZone, bedNumber, onChange }: BedPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          베드 선택
        </span>
        <BedBadge bedZone={bedZone} bedNumber={bedNumber} size="sm" />
      </div>

      {/* 구역 토글 */}
      <div className="flex gap-1.5">
        {ZONES.map((zone) => (
          <button
            key={zone}
            type="button"
            aria-label={`${zone}구역 선택`}
            onClick={() => onChange(zone, null)}
            className={cn(
              "flex-1 rounded-md border py-2 text-sm font-semibold transition-all",
              bedZone === zone
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-border text-muted-foreground hover:border-neutral-400 hover:text-neutral-900 dark:hover:border-neutral-500 dark:hover:text-white"
            )}
          >
            {zone}구역
          </button>
        ))}
      </div>

      {/* 번호 그리드 */}
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {BED_NUMBERS_BY_ZONE[bedZone].map((num) => (
          <button
            key={num}
            type="button"
            aria-label={`${bedZone}구역 ${num}번 베드 선택`}
            onClick={() => onChange(bedZone, num)}
            className={cn(
              "h-10 w-full rounded-md border text-sm font-medium transition-all",
              bedNumber !== null && num === bedNumber
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-border text-neutral-900 hover:border-neutral-400 dark:text-neutral-100 dark:hover:border-neutral-500"
            )}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
