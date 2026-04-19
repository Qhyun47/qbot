"use client";

import { useState } from "react";
import { LayoutTemplate, Rows2, Columns } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type LayoutOption = "single" | "split_vertical" | "split_horizontal";

interface LayoutOptionItem {
  value: LayoutOption;
  label: string;
  description: string;
  Icon: LucideIcon;
}

const LAYOUT_OPTIONS: LayoutOptionItem[] = [
  {
    value: "single",
    label: "단독",
    description: "입력 화면만 전체 표시",
    Icon: LayoutTemplate,
  },
  {
    value: "split_vertical",
    label: "상하 분할",
    description: "상단 가이드 / 하단 입력",
    Icon: Rows2,
  },
  {
    value: "split_horizontal",
    label: "좌우 분할",
    description: "좌측 입력 / 우측 가이드 (폴드/태블릿)",
    Icon: Columns,
  },
];

export function LayoutSettings() {
  const [selectedLayout, setSelectedLayout] = useState<LayoutOption>("single");

  function handleSave() {
    toast.success("설정이 저장되었습니다.");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium">입력 화면 레이아웃</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LAYOUT_OPTIONS.map(({ value, label, description, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedLayout(value)}
              className={cn(
                "flex flex-col items-center gap-3 rounded-lg border p-4 text-center transition-colors hover:bg-muted/50",
                selectedLayout === value
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <Icon className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave}>저장</Button>
    </div>
  );
}
