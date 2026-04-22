"use client";

import { useState, useTransition, useEffect } from "react";
import {
  LayoutTemplate,
  Rows2,
  Columns,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateLayoutSettings } from "@/lib/settings/actions";
import type { FoldFallbackLayout, InputLayout } from "@/lib/supabase/types";
import type { LucideIcon } from "lucide-react";

interface LayoutOptionItem {
  value: InputLayout;
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

const FONT_SIZE_OPTIONS = [
  { value: "14", label: "작게 (14px)" },
  { value: "16", label: "기본 (16px)" },
  { value: "18", label: "크게 (18px)" },
  { value: "20", label: "매우 크게 (20px)" },
] as const;

interface LayoutSettingsProps {
  defaultLayout: InputLayout;
  defaultSplitRatio: number;
  defaultMobileFontSize: number;
  defaultFoldAutoSwitch: boolean;
  defaultFoldFallbackLayout: FoldFallbackLayout;
}

const THEME_OPTIONS = [
  { value: "light", label: "라이트", Icon: Sun },
  { value: "dark", label: "다크", Icon: Moon },
  { value: "system", label: "시스템", Icon: Monitor },
] as const;

export function LayoutSettings({
  defaultLayout,
  defaultSplitRatio,
  defaultMobileFontSize,
  defaultFoldAutoSwitch,
  defaultFoldFallbackLayout,
}: LayoutSettingsProps) {
  const [selectedLayout, setSelectedLayout] =
    useState<InputLayout>(defaultLayout);
  const [splitRatio, setSplitRatio] = useState(defaultSplitRatio);
  const [mobileFontSize, setMobileFontSize] = useState(defaultMobileFontSize);
  const [foldAutoSwitch, setFoldAutoSwitch] = useState(defaultFoldAutoSwitch);
  const [foldFallbackLayout, setFoldFallbackLayout] =
    useState<FoldFallbackLayout>(defaultFoldFallbackLayout);
  const [, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSplit = selectedLayout !== "single";

  const firstLabel = selectedLayout === "split_vertical" ? "가이드" : "입력";
  const secondLabel = selectedLayout === "split_vertical" ? "입력" : "가이드";

  function handleSave() {
    startTransition(async () => {
      try {
        await updateLayoutSettings(
          selectedLayout,
          splitRatio,
          mobileFontSize,
          foldAutoSwitch,
          foldFallbackLayout
        );
        document.documentElement.style.setProperty(
          "--mobile-font-size",
          `${mobileFontSize}px`
        );
        toast.success("설정이 저장되었습니다.");
      } catch {
        toast.error("저장에 실패했습니다.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">화면 테마</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            라이트/다크 모드를 선택하거나 기기 설정을 따릅니다.
          </p>
        </div>
        <div className="flex gap-3">
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const isSelected = mounted && theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all",
                  isSelected
                    ? "border-zinc-900 bg-zinc-100 shadow-sm dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-300 bg-white hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-400"
                )}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-foreground">
                    <Check className="size-3 text-background" />
                  </span>
                )}
                <Icon
                  className={cn(
                    "size-6",
                    isSelected
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-500"
                  )}
                />
                <p
                  className={cn(
                    "text-xs font-medium",
                    isSelected
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  {label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

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
                  "relative flex flex-col items-center gap-3 rounded-lg border-2 p-5 text-center transition-all",
                  isSelected
                    ? "border-zinc-900 bg-zinc-100 shadow-sm dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-300 bg-white hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-400"
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
                    isSelected
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-500"
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isSelected
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
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

      {isSplit && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">분할 비율</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              두 영역의 기본 크기 비율을 설정하세요. (드래그로 실시간 조정도
              가능합니다)
            </p>
          </div>
          <div className="space-y-3">
            <Slider
              min={30}
              max={70}
              step={5}
              value={[splitRatio]}
              onValueChange={([v]) => setSplitRatio(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {firstLabel} {splitRatio}%
              </span>
              <span>
                {secondLabel} {100 - splitRatio}%
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedLayout === "split_horizontal" && (
        <div className="space-y-4 rounded-lg border-2 border-zinc-300 p-4 dark:border-zinc-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">갤럭시 폴드 자동 전환</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                폰을 접으면 (화면 너비 600px 이하) 자동으로 레이아웃을
                변경합니다.
              </p>
            </div>
            <Switch
              checked={foldAutoSwitch}
              onCheckedChange={setFoldAutoSwitch}
              aria-label="갤럭시 폴드 자동 전환"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              접었을 때 전환할 레이아웃
            </p>
            <div className="flex gap-3">
              {(["single", "split_vertical"] as const).map((value) => {
                const labels: Record<string, string> = {
                  single: "단독",
                  split_vertical: "상하 분할",
                };
                const isSelected = foldFallbackLayout === value;
                const isDisabled = !foldAutoSwitch;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setFoldFallbackLayout(value)}
                    style={{
                      border: isSelected
                        ? "2px solid #3f3f46"
                        : "2px solid #a1a1aa",
                      background: isSelected ? "#e4e4e7" : "#f4f4f5",
                      color: isSelected ? "#18181b" : "#52525b",
                      opacity: isDisabled ? 0.7 : 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                    className="flex flex-1 items-center justify-center rounded-md px-3 py-2.5 text-sm font-medium transition-all"
                  >
                    {isSelected && (
                      <Check className="mr-1.5 size-3.5 shrink-0" />
                    )}
                    {labels[value]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 md:hidden">
        <div>
          <p className="text-sm font-medium">모바일 글자 크기</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            모바일 화면에서만 적용됩니다. PC에서는 브라우저 기본값을 따릅니다.
          </p>
        </div>
        <Select
          value={String(mobileFontSize)}
          onValueChange={(v) => setMobileFontSize(Number(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} size="sm">
        저장
      </Button>
    </div>
  );
}
