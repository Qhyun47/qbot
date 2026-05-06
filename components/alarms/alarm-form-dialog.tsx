"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Clock, Minus, Plus, RefreshCw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useCompactMode } from "@/components/compact-mode-provider";
import { createAlarm, updateAlarm } from "@/lib/alarms/actions";
import { requestAlarmNotificationPermission } from "@/components/alarms/alarm-scheduler";
import type { Alarm, Case } from "@/lib/supabase/types";

const schema = z
  .object({
    title: z.string().min(1, "제목을 입력해주세요"),
    bedKey: z.string().optional(),
    timeMode: z.enum(["specific", "relative"]),
    specificTime: z.string().optional(),
    relativeMinutes: z.number().optional(),
    hasRepeat: z.boolean(),
    repeatIntervalMinutes: z.number().optional(),
    repeatCount: z.number().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.timeMode === "specific") {
      if (!val.specificTime) {
        ctx.addIssue({
          code: "custom",
          path: ["specificTime"],
          message: "시간을 입력해주세요",
        });
        return;
      }
      const scheduled = parseSpecificTime(val.specificTime);
      const now = new Date();
      if (scheduled <= now) {
        ctx.addIssue({
          code: "custom",
          path: ["specificTime"],
          message: "현재 시각 이후로 설정해주세요",
        });
      } else if (scheduled.getTime() - now.getTime() > 24 * 60 * 60 * 1000) {
        ctx.addIssue({
          code: "custom",
          path: ["specificTime"],
          message: "24시간 이내로 설정해주세요",
        });
      }
    } else {
      if (!val.relativeMinutes || val.relativeMinutes < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["relativeMinutes"],
          message: "1분 이상 입력해주세요",
        });
      }
    }
    if (val.hasRepeat) {
      if (
        !val.repeatIntervalMinutes ||
        val.repeatIntervalMinutes < 3 ||
        val.repeatIntervalMinutes > 60
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["repeatIntervalMinutes"],
          message: "3~60분 사이로 입력해주세요",
        });
      }
      if (!val.repeatCount || val.repeatCount < 1 || val.repeatCount > 10) {
        ctx.addIssue({
          code: "custom",
          path: ["repeatCount"],
          message: "1~10회 사이로 입력해주세요",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

function parseSpecificTime(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(h, m, 0, 0);
  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

function buildBedOptions(cases: Case[]): { label: string; value: string }[] {
  const seen = new Set<string>();
  const options: { label: string; value: string }[] = [];
  for (const c of cases) {
    if (!c.bed_zone || c.bed_number == null) continue;
    const key = `${c.bed_zone}-${c.bed_number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({
      label: `${c.bed_zone}${String(c.bed_number).padStart(2, "0")}`,
      value: key,
    });
  }
  return options;
}

function alarmToDefaultValues(alarm: Alarm): Partial<FormValues> {
  const bedKey =
    alarm.bed_zone && alarm.bed_number != null
      ? `${alarm.bed_zone}-${alarm.bed_number}`
      : undefined;
  return {
    title: alarm.title,
    bedKey,
    timeMode: "specific",
    specificTime: new Date(alarm.scheduled_at).toTimeString().slice(0, 5),
    hasRepeat: (alarm.repeat_count ?? 0) > 0,
    repeatIntervalMinutes: alarm.repeat_interval_minutes ?? undefined,
    repeatCount:
      alarm.remaining_repeat_count ?? alarm.repeat_count ?? undefined,
  };
}

const TIME_PRESETS = [5, 10, 15, 30, 60] as const;
const INTERVAL_PRESETS = [5, 10, 15, 30] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: Case[];
  initialAlarm?: Alarm;
  onSuccess?: () => void;
}

export function AlarmFormDialog({
  open,
  onOpenChange,
  cases,
  initialAlarm,
  onSuccess,
}: Props) {
  const { isCompact } = useCompactMode();
  const bedOptions = buildBedOptions(cases);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialAlarm
      ? alarmToDefaultValues(initialAlarm)
      : {
          title: "",
          timeMode: "relative",
          relativeMinutes: 30,
          hasRepeat: false,
          repeatIntervalMinutes: 5,
          repeatCount: 3,
        },
  });

  const timeMode = watch("timeMode");
  const hasRepeat = watch("hasRepeat");
  const bedKey = watch("bedKey");
  const relativeMinutes = watch("relativeMinutes");
  const repeatIntervalMinutes = watch("repeatIntervalMinutes");
  const repeatCount = watch("repeatCount") ?? 3;

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const [bedZone, bedNumberStr] = values.bedKey?.split("-") ?? [];
      const input = {
        title: values.title,
        bedZone: bedZone || undefined,
        bedNumber: bedNumberStr != null ? Number(bedNumberStr) : undefined,
        timeMode: values.timeMode,
        specificTime:
          values.timeMode === "specific" && values.specificTime
            ? parseSpecificTime(values.specificTime).toISOString()
            : undefined,
        relativeMinutes:
          values.timeMode === "relative" ? values.relativeMinutes : undefined,
        repeatIntervalMinutes: values.hasRepeat
          ? values.repeatIntervalMinutes
          : undefined,
        repeatCount: values.hasRepeat ? values.repeatCount : undefined,
      };

      if (initialAlarm) {
        await updateAlarm(initialAlarm.id, {
          ...input,
          remainingRepeatCount: values.hasRepeat
            ? values.repeatCount
            : undefined,
        });
      } else {
        await requestAlarmNotificationPermission();
        await createAlarm(input);
      }

      onOpenChange(false);
      onSuccess?.();
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  const formTitle = initialAlarm ? "알람 수정" : "알람 추가";

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-1">
      {/* 제목 */}
      <div className="space-y-1.5">
        <Label htmlFor="alarm-title" className="text-sm font-medium">
          제목
        </Label>
        <Input
          id="alarm-title"
          placeholder="알람 제목을 입력하세요"
          className="h-10"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* 환자 선택 — 칩 방식 */}
      {bedOptions.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">환자</Label>
              <span className="text-xs text-muted-foreground">선택 사항</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setValue("bedKey", undefined)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  !bedKey
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                선택 안 함
              </button>
              {bedOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setValue(
                      "bedKey",
                      bedKey === opt.value ? undefined : opt.value
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-xs font-semibold transition-colors",
                    bedKey === opt.value
                      ? "border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "border-border bg-background text-foreground hover:border-neutral-400"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 시간 설정 */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">시간 설정</span>
        </div>

        {/* 세그먼트 탭 */}
        <ToggleGroup
          type="single"
          variant="outline"
          value={timeMode}
          onValueChange={(v) => {
            if (v) setValue("timeMode", v as "specific" | "relative");
          }}
          className="w-full"
        >
          <ToggleGroupItem value="relative" className="flex-1 gap-1.5 text-sm">
            <Timer className="h-3.5 w-3.5" />몇 분 후
          </ToggleGroupItem>
          <ToggleGroupItem value="specific" className="flex-1 gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5" />
            특정 시각
          </ToggleGroupItem>
        </ToggleGroup>

        {/* relative 모드 */}
        {timeMode === "relative" && (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-1.5">
              {TIME_PRESETS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() =>
                    setValue("relativeMinutes", min, { shouldValidate: true })
                  }
                  className={cn(
                    "rounded-md border py-1.5 text-xs font-medium transition-colors",
                    relativeMinutes === min
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                  )}
                >
                  {min < 60 ? `${min}분` : "1시간"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                placeholder="직접 입력"
                className="h-9 text-sm"
                {...register("relativeMinutes", { valueAsNumber: true })}
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                분 후
              </span>
            </div>
            {errors.relativeMinutes && (
              <p className="text-xs text-destructive">
                {errors.relativeMinutes.message}
              </p>
            )}
          </div>
        )}

        {/* specific 모드 */}
        {timeMode === "specific" && (
          <div className="space-y-1.5">
            <Input
              type="time"
              className="h-10 text-base tabular-nums"
              {...register("specificTime")}
            />
            <p className="text-xs text-muted-foreground">
              현재 시각 이후 ~ 24시간 이내
            </p>
            {errors.specificTime && (
              <p className="text-xs text-destructive">
                {errors.specificTime.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 반복 알람 */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">반복 알람</span>
          </div>
          <Switch
            checked={hasRepeat}
            onCheckedChange={(v) => setValue("hasRepeat", v)}
          />
        </div>

        {hasRepeat && (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-3">
            {/* 반복 간격 */}
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                반복 간격
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {INTERVAL_PRESETS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() =>
                      setValue("repeatIntervalMinutes", min, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "rounded-md border py-1.5 text-xs font-medium transition-colors",
                      repeatIntervalMinutes === min
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                    )}
                  >
                    {min}분
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={3}
                  max={60}
                  placeholder="직접 입력"
                  className="h-9 text-sm"
                  {...register("repeatIntervalMinutes", {
                    valueAsNumber: true,
                  })}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  분마다 (3~60)
                </span>
              </div>
              {errors.repeatIntervalMinutes && (
                <p className="text-xs text-destructive">
                  {errors.repeatIntervalMinutes.message}
                </p>
              )}
            </div>

            {/* 반복 횟수 스텝퍼 */}
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                반복 횟수
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (repeatCount > 1)
                      setValue("repeatCount", repeatCount - 1, {
                        shouldValidate: true,
                      });
                  }}
                  disabled={repeatCount <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-xl font-semibold tabular-nums">
                    {repeatCount}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">회</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (repeatCount < 10)
                      setValue("repeatCount", repeatCount + 1, {
                        shouldValidate: true,
                      });
                  }}
                  disabled={repeatCount >= 10}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {errors.repeatCount && (
                <p className="text-xs text-destructive">
                  {errors.repeatCount.message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <Button
        type="submit"
        disabled={submitting}
        size="lg"
        className="w-full gap-2 font-semibold"
      >
        <Bell className="h-4 w-4" />
        {submitting ? "저장 중..." : initialAlarm ? "알람 수정" : "알람 추가"}
      </Button>
    </form>
  );

  if (isCompact) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {formTitle}
            </DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[75dvh] overflow-y-auto px-4 pb-8">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {formTitle}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
