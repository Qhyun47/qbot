"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCompactMode } from "@/components/compact-mode-provider";
import { CompactModeToggle } from "@/components/dashboard/compact-mode-toggle";
import { CompactStatusList } from "@/components/dashboard/compact-status-list";
import { StatusBoard } from "@/components/cases/status-board";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { HideAllFromBoardButton } from "@/components/cases/hide-all-from-board-button";
import { AlarmBar } from "@/components/alarms/alarm-bar";
import { AlarmFormDialog } from "@/components/alarms/alarm-form-dialog";
import { MedicationTriggerButton } from "@/components/medication/medication-trigger-button";
import { NewCaseButton } from "@/components/cases/new-case-button";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { confirmAlarm, deleteAlarm } from "@/lib/alarms/actions";
import type { Alarm, Case } from "@/lib/supabase/types";

interface DashboardViewProps {
  cases: Case[];
  alarms: Alarm[];
}

export function DashboardView({ cases, alarms }: DashboardViewProps) {
  const { isCompact } = useCompactMode();
  const { viewMode } = useViewMode();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | undefined>();
  const [, startTransition] = useTransition();

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

  if (isCompact) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-end border-b px-3 py-2">
          <CompactModeToggle />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pt-2">
            <AlarmBar
              alarms={alarms}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
          <CompactStatusList cases={cases} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-y-1.5 border-b pb-2">
        {/* 좌측: 뷰 전환 + 현황판 컨트롤 */}
        <div className="flex shrink-0 items-center gap-1">
          <CompactModeToggle />
          <div className="mx-1.5 h-4 w-px bg-border/60" />
          <RefreshButton />
          <HideAllFromBoardButton />
        </div>
        {/* 우측: 글로벌 액션 */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={handleNewAlarm}
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">알람 추가</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="lg:hidden">알람 추가</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <MedicationTriggerButton size="sm" />
          {viewMode !== "mobile" && (
            <NewCaseButton size="sm" className="gap-1.5" />
          )}
        </div>
      </div>

      <AlarmBar
        alarms={alarms}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <StatusBoard cases={cases} />

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
