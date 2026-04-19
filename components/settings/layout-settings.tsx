"use client";

import { useState } from "react";
import { LayoutTemplate, Rows2, Columns, Check } from "lucide-react";
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
        <div>
          <p className="text-sm font-medium">입력 화면 레이아웃</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            새 케이스 입력 화면에서 가이드라인 패널을 어떻게 배치할지
            선택하세요.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LAYOUT_OPTIONS.map(({ value, label, description, Icon }) => {
            const isSelected = selectedLayout === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedLayout(value)}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-lg border p-5 text-center transition-all",
                  isSelected
                    ? "border-foreground bg-card shadow-sm"
                    : "border-border bg-card hover:border-foreground/30 hover:bg-muted/30"
                )}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-foreground">
                    <Check className="size-3 text-background" />
                  </span>
                )}
                <Icon
                  className={cn(
                    "size-8",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={handleSave} size="sm">
        저장
      </Button>
    </div>
  );
}
