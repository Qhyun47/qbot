"use client";

import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BedBadge } from "@/components/cases/bed-badge";
import type { Alarm } from "@/lib/supabase/types";
import type { BedZone } from "@/lib/supabase/types";

interface Props {
  alarm: Alarm;
  onConfirm?: (id: string) => void;
  onEdit?: (alarm: Alarm) => void;
  onDelete?: (id: string) => void;
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

export function AlarmListItem({ alarm, onConfirm, onEdit, onDelete }: Props) {
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const scheduledAt = new Date(alarm.scheduled_at);
  const isOverdue = !alarm.is_confirmed && scheduledAt <= now;
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
    <div className="flex items-center gap-2 py-1.5">
      {/* 베드 배지 */}
      {alarm.bed_zone && alarm.bed_number != null && (
        <BedBadge
          bedZone={alarm.bed_zone as BedZone}
          bedNumber={alarm.bed_number}
          size="sm"
        />
      )}

      {/* 제목 + 시간 */}
      <div className="min-w-0 flex-1">
        <span className="truncate text-sm font-medium">{alarm.title}</span>
        {isCompleted ? (
          <span className="ml-1.5 text-xs text-muted-foreground">
            {alarm.confirmed_at ? formatTime(alarm.confirmed_at) : ""}
          </span>
        ) : (
          <span
            className={`ml-1.5 text-xs ${isOverdue ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
          >
            {formatAlarmTime(alarm.scheduled_at)}
          </span>
        )}
      </div>

      {/* 액션 버튼 */}
      {isCompleted && (
        <Check className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      {isOverdue && (
        <Button
          size="sm"
          variant="default"
          className="h-7 shrink-0 bg-amber-500 px-2 text-xs hover:bg-amber-600"
          onClick={handleConfirm}
          disabled={loading}
        >
          확인
        </Button>
      )}
      {isUpcoming && (
        <div className="flex shrink-0 gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => onEdit?.(alarm)}
            disabled={loading}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
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
