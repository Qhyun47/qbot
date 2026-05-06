"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BedBadge } from "@/components/cases/bed-badge";
import { cn } from "@/lib/utils";
import type { Alarm, BedZone } from "@/lib/supabase/types";

interface Props {
  alarm: Alarm;
  onConfirm?: (id: string) => void;
  onEdit?: (alarm: Alarm) => void;
  onDelete?: (id: string) => void;
  alwaysShowActions?: boolean;
}

function formatAlarmTime(scheduledAt: string): string {
  const diff = Math.round(
    (new Date(scheduledAt).getTime() - Date.now()) / 1000
  );
  const abs = Math.abs(diff);

  if (abs < 60) return "방금";
  if (abs < 3600) {
    const mins = Math.round(abs / 60);
    return diff > 0 ? `${mins}분 뒤` : `${mins}분 전`;
  }
  const hrs = Math.round(abs / 3600);
  return diff > 0 ? `${hrs}시간 뒤` : `${hrs}시간 전`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlarmListItem({
  alarm,
  onConfirm,
  onEdit,
  onDelete,
  alwaysShowActions = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const scheduledAt = new Date(alarm.scheduled_at);
  const minutesUntil = (scheduledAt.getTime() - now.getTime()) / 60000;
  const isOverdue = !alarm.is_confirmed && scheduledAt <= now;
  const isDueSoon =
    !alarm.is_confirmed && minutesUntil > 0 && minutesUntil <= 5;
  const isUpcoming = !alarm.is_confirmed && scheduledAt > now;
  const isCompleted = alarm.is_confirmed;

  async function handleConfirm() {
    setLoading(true);
    try {
      onConfirm?.(alarm.id);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      onDelete?.(alarm.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg border-l-[3px] px-3 py-2.5 transition-colors",
        isOverdue && "border-l-red-500 bg-red-50/70 dark:bg-red-950/20",
        isDueSoon && "border-l-amber-400 bg-amber-50/70 dark:bg-amber-950/20",
        isUpcoming && !isDueSoon && "border-l-blue-400 hover:bg-muted/40",
        isCompleted && "border-l-transparent opacity-60"
      )}
    >
      {alarm.bed_zone && alarm.bed_number != null && (
        <BedBadge
          bedZone={alarm.bed_zone as BedZone}
          bedNumber={alarm.bed_number}
          size="sm"
        />
      )}

      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          isCompleted && "text-muted-foreground line-through"
        )}
      >
        {alarm.title}
      </span>

      {isCompleted ? (
        <>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {alarm.confirmed_at ? formatTime(alarm.confirmed_at) : "완료"}
          </span>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        </>
      ) : (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
            isOverdue &&
              "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
            isDueSoon &&
              "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
            isUpcoming &&
              !isDueSoon &&
              "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          )}
        >
          {formatAlarmTime(alarm.scheduled_at)}
        </span>
      )}

      {isOverdue && (
        <Button
          size="sm"
          className="h-7 shrink-0 rounded-full bg-red-500 px-3 text-xs font-semibold hover:bg-red-600"
          onClick={handleConfirm}
          disabled={loading}
        >
          확인
        </Button>
      )}

      {isUpcoming && (
        <div
          className={cn(
            "flex shrink-0 gap-0.5 transition-opacity",
            alwaysShowActions
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit?.(alarm)}
            disabled={loading}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
