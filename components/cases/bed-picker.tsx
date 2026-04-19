"use client";

import { BedBadge } from "@/components/cases/bed-badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BED_NUMBERS_BY_ZONE } from "@/lib/cases/bed-config";
import type { BedZone } from "@/lib/supabase/types";

interface BedPickerProps {
  bedZone: BedZone;
  bedNumber: number;
  onChange: (zone: BedZone, number: number) => void;
}

export function BedPicker({ bedZone, bedNumber, onChange }: BedPickerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">베드 번호</span>
        <BedBadge bedZone={bedZone} bedNumber={bedNumber} size="sm" />
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        value={bedZone}
        onValueChange={(value) => {
          if (value) onChange(value as BedZone, 1);
        }}
        className="w-full"
      >
        {(["A", "B", "R"] as const).map((zone) => (
          <ToggleGroupItem
            key={zone}
            value={zone}
            aria-label={`${zone}구역 선택`}
            className="flex-1"
          >
            {zone}구역
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {BED_NUMBERS_BY_ZONE[bedZone].map((num) => (
          <Button
            key={num}
            variant={num === bedNumber ? "default" : "outline"}
            size="sm"
            className="h-10 w-full"
            aria-label={`${bedZone}구역 ${num}번 베드 선택`}
            onClick={() => onChange(bedZone, num)}
          >
            {num}
          </Button>
        ))}
      </div>
    </div>
  );
}
