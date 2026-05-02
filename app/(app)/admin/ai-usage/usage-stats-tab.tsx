"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUsageStats } from "@/lib/admin/ai-usage-queries";
import type { UserUsageStat } from "@/lib/admin/ai-usage-queries";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCost(usd: number): string {
  if (usd < 0.001) return "< $0.001";
  return `$${usd.toFixed(3)}`;
}

function getDateRange(preset: "7d" | "30d" | "all"): {
  from: string;
  to: string;
} {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  if (preset === "7d") {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (preset === "30d") {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  return { from: "2020-01-01T00:00:00.000Z", to: to.toISOString() };
}

function UserStatRow({ stat }: { stat: UserUsageStat }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30"
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {stat.full_name ?? "(이름 없음)"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {stat.email ?? ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-6 text-xs">
          <span className="w-14 text-right tabular-nums text-muted-foreground">
            {stat.total_calls}회
          </span>
          <span className="w-20 text-right tabular-nums text-muted-foreground">
            {formatTokens(stat.input_tokens)}
          </span>
          <span className="w-20 text-right tabular-nums text-muted-foreground">
            {formatTokens(stat.output_tokens)}
          </span>
          <span className="w-24 text-right font-medium tabular-nums">
            {formatCost(stat.estimated_cost)}
          </span>
        </div>
      </button>

      {open && stat.daily.length > 0 && (
        <div className="ml-7 border-l">
          <div className="flex items-center gap-6 bg-muted/20 px-4 py-1.5 text-xs text-muted-foreground">
            <span className="flex-1">날짜</span>
            <span className="w-14 text-right">호출</span>
            <span className="w-20 text-right">입력</span>
            <span className="w-20 text-right">출력</span>
            <span className="w-24 text-right">추정 비용</span>
          </div>
          {[...stat.daily].reverse().map((day) => (
            <div
              key={day.date}
              className="flex items-center gap-6 border-b px-4 py-2 text-xs last:border-0"
            >
              <span className="flex-1 text-muted-foreground">{day.date}</span>
              <span className="w-14 text-right tabular-nums">
                {day.total_calls}회
              </span>
              <span className="w-20 text-right tabular-nums text-muted-foreground">
                {formatTokens(day.input_tokens)}
              </span>
              <span className="w-20 text-right tabular-nums text-muted-foreground">
                {formatTokens(day.output_tokens)}
              </span>
              <span className="w-24 text-right tabular-nums">
                {formatCost(day.estimated_cost)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UsageStatsTab() {
  const [preset, setPreset] = useState<"7d" | "30d" | "all">("30d");
  const [stats, setStats] = useState<UserUsageStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: "7d" | "30d" | "all") => {
    setLoading(true);
    const { from, to } = getDateRange(p);
    getUsageStats(from, to).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load(preset);
  }, [load, preset]);

  const totalCalls = stats.reduce((s, u) => s + u.total_calls, 0);
  const totalInput = stats.reduce((s, u) => s + u.input_tokens, 0);
  const totalOutput = stats.reduce((s, u) => s + u.output_tokens, 0);
  const totalCost = stats.reduce((s, u) => s + u.estimated_cost, 0);

  return (
    <div>
      {/* 날짜 범위 선택 */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="text-xs text-muted-foreground">기간:</span>
        {(["7d", "30d", "all"] as const).map((p) => (
          <Button
            key={p}
            variant={preset === p ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPreset(p)}
          >
            {p === "7d" ? "최근 7일" : p === "30d" ? "최근 30일" : "전체"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : stats.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          해당 기간에 AI 사용 기록이 없습니다.
        </p>
      ) : (
        <>
          {/* 합계 요약 */}
          <div className="flex gap-6 border-b bg-muted/30 px-4 py-3 text-xs">
            <div>
              <p className="text-muted-foreground">총 호출</p>
              <p className="mt-0.5 text-base font-semibold">
                {totalCalls.toLocaleString()}회
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">입력 토큰</p>
              <p className="mt-0.5 text-base font-semibold">
                {formatTokens(totalInput)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">출력 토큰</p>
              <p className="mt-0.5 text-base font-semibold">
                {formatTokens(totalOutput)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">추정 비용</p>
              <p className="mt-0.5 text-base font-semibold">
                {formatCost(totalCost)}
              </p>
            </div>
            <p className={cn("ml-auto self-end text-muted-foreground")}>
              * Gemini 2.5 Flash 단가 기준 추정 ($0.15/M 입력, $0.60/M 출력)
            </p>
          </div>

          {/* 컬럼 헤더 */}
          <div className="flex items-center gap-6 border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            <span className="w-4 shrink-0" />
            <span className="flex-1">이름 / 이메일</span>
            <span className="w-14 text-right">호출 수</span>
            <span className="w-20 text-right">입력 토큰</span>
            <span className="w-20 text-right">출력 토큰</span>
            <span className="w-24 text-right">추정 비용</span>
          </div>

          {stats.map((s) => (
            <UserStatRow key={s.user_id} stat={s} />
          ))}
        </>
      )}
    </div>
  );
}
