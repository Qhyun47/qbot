"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getUserActivityList,
  getUserCases,
} from "@/lib/admin/ai-usage-queries";
import type {
  UserActivitySummary,
  UserCaseSummary,
} from "@/lib/admin/ai-usage-queries";
import { CaseDetailPanel } from "./case-detail-panel";
import templateList from "@/lib/ai/resources/template-list.json";

const TEMPLATE_ORDER = new Map(templateList.map((t, i) => [t.templateKey, i]));
const TEMPLATE_NAME = new Map(
  templateList.map((t) => [t.templateKey, t.displayName])
);

const STATUS_LABEL: Record<string, string> = {
  draft: "작성 중",
  generating: "생성 중",
  completed: "완료",
  failed: "실패",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "text-muted-foreground",
  generating: "text-blue-600 dark:text-blue-400",
  completed: "text-green-600 dark:text-green-400",
  failed: "text-destructive",
};

type CaseStatus = "draft" | "generating" | "completed" | "failed";
type SortMode = "time" | "template";

const STATUS_OPTIONS: { key: CaseStatus; label: string }[] = [
  { key: "draft", label: "작성 중" },
  { key: "generating", label: "생성 중" },
  { key: "completed", label: "완료" },
  { key: "failed", label: "실패" },
];

function applyFilterSort(
  cases: UserCaseSummary[],
  activeStatuses: Set<CaseStatus>,
  sort: SortMode
): UserCaseSummary[] {
  let result = cases;

  if (activeStatuses.size > 0) {
    result = result.filter((c) => activeStatuses.has(c.status as CaseStatus));
  }

  if (sort === "template") {
    result = [...result].sort((a, b) => {
      const aKey = a.template_keys[0] ?? a.template_key ?? null;
      const bKey = b.template_keys[0] ?? b.template_key ?? null;
      const aIdx =
        aKey !== null ? (TEMPLATE_ORDER.get(aKey) ?? Infinity) : Infinity;
      const bIdx =
        bKey !== null ? (TEMPLATE_ORDER.get(bKey) ?? Infinity) : Infinity;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return b.created_at.localeCompare(a.created_at);
    });
  }

  return result;
}

function CaseRow({ c }: { c: UserCaseSummary }) {
  const [open, setOpen] = useState(false);
  const templateName =
    (c.template_keys[0] ?? c.template_key)
      ? TEMPLATE_NAME.get(c.template_keys[0] ?? c.template_key ?? "")
      : null;

  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50"
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {c.cc ?? c.ccs?.join(", ") ?? "(C.C. 없음)"}
        </span>
        {templateName && (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {templateName}
          </span>
        )}
        <span className={cn("shrink-0 text-xs", STATUS_CLASS[c.status] ?? "")}>
          {STATUS_LABEL[c.status] ?? c.status}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(c.created_at).toLocaleString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </button>
      {open && <CaseDetailPanel caseId={c.id} />}
    </div>
  );
}

interface UserRowProps {
  user: UserActivitySummary;
  activeStatuses: Set<CaseStatus>;
  sort: SortMode;
}

function UserRow({ user, activeStatuses, sort }: UserRowProps) {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<UserCaseSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  function handleToggle() {
    if (!open && cases === null) {
      setLoading(true);
      getUserCases(user.id).then((c) => {
        setCases(c);
        setLoading(false);
      });
    }
    setOpen((v) => !v);
  }

  const visibleCases =
    cases !== null ? applyFilterSort(cases, activeStatuses, sort) : null;

  return (
    <div className="border-b last:border-0">
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <User className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {user.full_name ?? "(이름 없음)"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email ?? ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
          <span>케이스 {user.case_count}건</span>
          <span>AI {user.ai_usage_count}회</span>
          <span>
            {user.last_activity
              ? new Date(user.last_activity).toLocaleString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "활동 없음"}
          </span>
        </div>
      </button>

      {open && (
        <div className="ml-10 border-l bg-background">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              불러오는 중...
            </div>
          )}
          {visibleCases !== null && visibleCases.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {activeStatuses.size > 0
                ? "선택한 상태에 해당하는 케이스가 없습니다."
                : "케이스가 없습니다."}
            </p>
          )}
          {visibleCases !== null &&
            visibleCases.map((c) => <CaseRow key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}

export function UserActivityTab() {
  const [users, setUsers] = useState<UserActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatuses, setActiveStatuses] = useState<Set<CaseStatus>>(
    new Set()
  );
  const [sort, setSort] = useState<SortMode>("time");

  useEffect(() => {
    getUserActivityList().then((u) => {
      setUsers(u);
      setLoading(false);
    });
  }, []);

  function toggleStatus(key: CaseStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        <span className="text-sm">불러오는 중...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        등록된 사용자가 없습니다.
      </p>
    );
  }

  return (
    <div>
      {/* 필터 / 정렬 옵션 바 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">상태:</span>
          {STATUS_OPTIONS.map(({ key, label }) => (
            <Button
              key={key}
              variant={activeStatuses.has(key) ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => toggleStatus(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">정렬:</span>
          <Button
            variant={sort === "time" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSort("time")}
          >
            시간순
          </Button>
          <Button
            variant={sort === "template" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSort("template")}
          >
            상용구별
          </Button>
        </div>
      </div>

      {/* 컬럼 헤더 */}
      <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <span className="w-4 shrink-0" />
        <span className="w-4 shrink-0" />
        <span className="flex-1">이름 / 이메일</span>
        <div className="flex shrink-0 items-center gap-4">
          <span className="w-14 text-right">케이스</span>
          <span className="w-14 text-right">AI 사용</span>
          <span className="w-28 text-right">마지막 활동</span>
        </div>
      </div>

      {users.map((u) => (
        <UserRow
          key={u.id}
          user={u}
          activeStatuses={activeStatuses}
          sort={sort}
        />
      ))}
    </div>
  );
}
