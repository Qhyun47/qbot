"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AlarmListItem } from "@/components/alarms/alarm-list-item";
import { AlarmFormDialog } from "@/components/alarms/alarm-form-dialog";
import { confirmAlarm, deleteAlarm } from "@/lib/alarms/actions";
import type { Alarm, Case } from "@/lib/supabase/types";

interface Props {
  alarms: Alarm[];
  cases: Case[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AlarmBottomSheet({ alarms, cases, open, onOpenChange }: Props) {
  const [formOpen, setFormOpen] = useState(false);
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
  const isEmpty =
    unconfirmed.length === 0 && upcoming.length === 0 && completed.length === 0;

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
    setFormOpen(true);
  }

  function handleNewAlarm() {
    setEditingAlarm(undefined);
    setFormOpen(true);
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center justify-between pr-2">
              <DrawerTitle>알람</DrawerTitle>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                onClick={handleNewAlarm}
              >
                <Plus className="h-3.5 w-3.5" />새 알람
              </Button>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-8">
            {isEmpty && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
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
              <div className="mb-2 rounded-md bg-amber-50 px-3 py-1 dark:bg-amber-950/30">
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
            {upcoming.length > 0 && (
              <div className="divide-y">
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
              <div className="mt-2 border-t pt-1">
                <button
                  type="button"
                  onClick={() => setCompletedExpanded((v) => !v)}
                  className="flex w-full items-center gap-1 py-1.5 text-xs text-muted-foreground"
                >
                  {completedExpanded ? "▼" : "▶"} 완료된 알람 {completed.length}
                  개
                </button>
                {completedExpanded && (
                  <div className="divide-y">
                    {completed.map((alarm) => (
                      <AlarmListItem key={alarm.id} alarm={alarm} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AlarmFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditingAlarm(undefined);
        }}
        cases={cases}
        initialAlarm={editingAlarm}
      />
    </>
  );
}
