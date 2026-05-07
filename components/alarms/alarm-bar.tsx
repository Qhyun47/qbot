"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { AlarmListItem } from "@/components/alarms/alarm-list-item";
import { fetchPastAlarms } from "@/lib/alarms/actions";
import type { Alarm } from "@/lib/supabase/types";

interface Props {
  alarms: Alarm[];
  onConfirm: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
}

export function AlarmBar({ alarms, onConfirm, onEdit, onDelete }: Props) {
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [pastAlarms, setPastAlarms] = useState<Alarm[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [hasMorePast, setHasMorePast] = useState(true);
  const loadingPastRef = useRef(false);

  const now = new Date();
  const overdue = alarms.filter(
    (a) => !a.is_confirmed && new Date(a.scheduled_at) <= now
  );
  const upcoming = alarms.filter(
    (a) => !a.is_confirmed && new Date(a.scheduled_at) > now
  );
  const completed = alarms.filter((a) => a.is_confirmed);
  const active = [...overdue, ...upcoming];

  async function handleLoadMorePast() {
    if (loadingPastRef.current) return;
    loadingPastRef.current = true;
    setLoadingPast(true);
    try {
      const allPast = [...completed, ...pastAlarms];
      const oldest = allPast.reduce<Alarm | undefined>((prev, cur) => {
        if (!prev) return cur;
        return (cur.confirmed_at ?? "") < (prev.confirmed_at ?? "")
          ? cur
          : prev;
      }, undefined);
      const cursor = oldest?.confirmed_at ?? undefined;
      const more = await fetchPastAlarms(cursor);
      if (more.length < 20) setHasMorePast(false);
      setPastAlarms((prev) => [...prev, ...more]);
    } catch {
      // 오류 시 재시도 가능하도록 hasMorePast 유지
    } finally {
      setLoadingPast(false);
      loadingPastRef.current = false;
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {active.map((alarm) => (
        <AlarmListItem
          key={alarm.id}
          alarm={alarm}
          onConfirm={onConfirm}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {/* 이전 알람 기록 — 항상 접근 가능 */}
      <div>
        <button
          type="button"
          onClick={() => setHistoryExpanded((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50"
        >
          {historyExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {completed.length > 0
            ? `완료된 알람 ${completed.length}개`
            : "이전 알람 기록"}
        </button>
        {historyExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {completed.map((alarm) => (
              <AlarmListItem key={alarm.id} alarm={alarm} />
            ))}
            {pastAlarms.map((alarm) => (
              <AlarmListItem key={alarm.id} alarm={alarm} />
            ))}
            {completed.length === 0 &&
              pastAlarms.length === 0 &&
              !loadingPast && (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  이전 알람 기록이 없습니다
                </p>
              )}
            {hasMorePast && (
              <button
                type="button"
                onClick={handleLoadMorePast}
                disabled={loadingPast}
                className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                {loadingPast ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                이전 알람 더 보기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
