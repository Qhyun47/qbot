"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUserActivityList,
  getUserCases,
} from "@/lib/admin/ai-usage-queries";
import type {
  UserActivitySummary,
  UserCaseSummary,
} from "@/lib/admin/ai-usage-queries";
import { CaseDetailPanel } from "./case-detail-panel";

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

function CaseRow({ c }: { c: UserCaseSummary }) {
  const [open, setOpen] = useState(false);

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

function UserRow({ user }: { user: UserActivitySummary }) {
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
          {cases !== null && cases.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              케이스가 없습니다.
            </p>
          )}
          {cases !== null && cases.map((c) => <CaseRow key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}

export function UserActivityTab() {
  const [users, setUsers] = useState<UserActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserActivityList().then((u) => {
      setUsers(u);
      setLoading(false);
    });
  }, []);

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
        <UserRow key={u.id} user={u} />
      ))}
    </div>
  );
}
