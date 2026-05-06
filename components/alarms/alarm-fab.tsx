"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlarmBottomSheet } from "@/components/alarms/alarm-bottom-sheet";
import type { Alarm, Case } from "@/lib/supabase/types";

interface Props {
  alarms: Alarm[];
  cases: Case[];
}

export function AlarmFab({ alarms, cases }: Props) {
  const [open, setOpen] = useState(false);

  const now = new Date();
  const unconfirmedCount = alarms.filter(
    (a) => !a.is_confirmed && new Date(a.scheduled_at) <= now
  ).length;
  const upcomingCount = alarms.filter(
    (a) => !a.is_confirmed && new Date(a.scheduled_at) > now
  ).length;
  const totalCount = unconfirmedCount + upcomingCount;
  const hasUnconfirmed = unconfirmedCount > 0;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50">
        <div className="relative">
          <Button
            type="button"
            size="icon"
            className="size-14 rounded-full shadow-lg [&_svg]:size-5"
            onClick={() => setOpen(true)}
            aria-label="알람"
          >
            <Bell />
          </Button>
          {totalCount > 0 && (
            <span
              className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white ${
                hasUnconfirmed ? "bg-amber-500" : "bg-blue-500"
              }`}
            >
              {totalCount}
            </span>
          )}
        </div>
      </div>

      <AlarmBottomSheet
        alarms={alarms}
        cases={cases}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
