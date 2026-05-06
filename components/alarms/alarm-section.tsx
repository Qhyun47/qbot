"use client";

import { useState, useTransition } from "react";
import { Bell, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="rounded-lg border bg-card">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-semibold">알람</span>
        {unconfirmed.length > 0 && (
          <Badge className="h-5 bg-amber-500 px-1.5 text-xs hover:bg-amber-500">
            {unconfirmed.length}
          </Badge>
        )}
        {upcoming.length > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {upcoming.length}
          </Badge>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-7 gap-1 px-2 text-xs"
          onClick={handleNewAlarm}
        >
          <Plus className="h-3.5 w-3.5" />새 알람
        </Button>
      </div>

      <div className="divide-y px-3">
        {/* 빈 상태 */}
        {isEmpty && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              예정된 알람이 없습니다
            </p>
            <Button size="sm" variant="outline" onClick={handleNewAlarm}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />새 알람 만들기
            </Button>
          </div>
        )}

        {/* 미확인 섹션 */}
        {unconfirmed.length > 0 && (
          <div className="rounded-md bg-amber-50 px-2 py-1 dark:bg-amber-950/30">
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

        {/* 예정 섹션 */}
        {upcoming.map((alarm) => (
          <AlarmListItem
            key={alarm.id}
            alarm={alarm}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {/* 완료 섹션 (접기) */}
        {completed.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setCompletedExpanded((v) => !v)}
              className="flex w-full items-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {completedExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              완료된 알람 {completed.length}개
            </button>
            {completedExpanded && (
              <div className="pb-1">
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
