"use client";

import { useState, useTransition } from "react";
import { Bell, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlarmListItem } from "@/components/alarms/alarm-list-item";
import { AlarmFormDialog } from "@/components/alarms/alarm-form-dialog";
import { confirmAlarm, deleteAlarm } from "@/lib/alarms/actions";
import type { Alarm, Case } from "@/lib/supabase/types";

interface Props {
  alarms: Alarm[];
  cases: Case[];
}

export function AlarmSection({ alarms, cases }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | undefined>();
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [, startTransition] = useTransition();

  const now = new Date();
  const unconfirmed = alarms.filter(
    (a) => !a.is_confirmed && new Date(a.scheduled_at) <= now
  );
  const upcoming = alarms.filter(
    (a) => !a.is_confirmed && new Date(a.scheduled_at) > now
  );
  const completed = alarms.filter((a) => a.is_confirmed);

  function handleConfirm(id: string) {
    startTransition(() => {
      confirmAlarm(id);
    });
  }

  function handleDelete(id: string) {
    startTransition(() => {
      deleteAlarm(id);
    });
  }

  function handleEdit(alarm: Alarm) {
    setEditingAlarm(alarm);
    setDialogOpen(true);
  }

  function handleNewAlarm() {
    setEditingAlarm(undefined);
    setDialogOpen(true);
  }

  const isEmpty =
    unconfirmed.length === 0 && upcoming.length === 0 && completed.length === 0;
  const showUpcomingLabel = upcoming.length > 0 && unconfirmed.length > 0;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-semibold">알람</span>
        {unconfirmed.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
            {unconfirmed.length}
          </span>
        )}
        {upcoming.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            {upcoming.length}
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleNewAlarm}
        >
          <Plus className="h-3.5 w-3.5" />새 알람
        </Button>
      </div>

      <div className="flex flex-col gap-1 border-t px-2 pb-2 pt-2">
        {/* 빈 상태 */}
        {isEmpty && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                예정된 알람이 없습니다
              </p>
              <p className="text-xs text-muted-foreground/60">
                새 알람을 만들어 중요한 일정을 놓치지 마세요
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={handleNewAlarm}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />새 알람 만들기
            </Button>
          </div>
        )}

        {/* 지금 확인 필요 */}
        {unconfirmed.length > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 px-1 pb-0.5 pt-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-red-500">
                지금 확인 필요
              </span>
            </div>
            {unconfirmed.map((alarm) => (
              <AlarmListItem
                key={alarm.id}
                alarm={alarm}
                onConfirm={handleConfirm}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* 예정된 알람 */}
        {upcoming.length > 0 && (
          <div className="space-y-0.5">
            {showUpcomingLabel && (
              <div className="flex items-center gap-1.5 px-1 pb-0.5 pt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">
                  예정된 알람
                </span>
              </div>
            )}
            {upcoming.map((alarm) => (
              <AlarmListItem
                key={alarm.id}
                alarm={alarm}
                onConfirm={handleConfirm}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* 완료 섹션 */}
        {completed.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setCompletedExpanded((v) => !v)}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              {completedExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              완료된 알람 {completed.length}개
            </button>
            {completedExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {completed.map((alarm) => (
                  <AlarmListItem key={alarm.id} alarm={alarm} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AlarmFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAlarm(undefined);
        }}
        cases={cases}
        initialAlarm={editingAlarm}
      />
    </div>
  );
}
