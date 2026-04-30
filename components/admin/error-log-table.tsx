"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ErrorLogWithEmail } from "@/lib/admin/error-log-actions";

interface ErrorLogTableProps {
  logs: ErrorLogWithEmail[];
  onDelete: (id: string) => Promise<void>;
}

export function ErrorLogTable({ logs, onDelete }: ErrorLogTableProps) {
  const [selected, setSelected] = useState<ErrorLogWithEmail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingId(id);
    startTransition(async () => {
      await onDelete(id);
      setDeletingId(null);
      if (selected?.id === id) setSelected(null);
    });
  };

  if (logs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        접수된 에러 로그가 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">날짜/시간</th>
              <th className="pb-2 pr-4 font-medium">페이지</th>
              <th className="pb-2 pr-4 font-medium">에러 메시지</th>
              <th className="pb-2 pr-4 font-medium">사용자</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => setSelected(log)}
                className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
              >
                <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-muted-foreground">
                  {format(new Date(log.created_at), "M/d HH:mm", {
                    locale: ko,
                  })}
                </td>
                <td className="max-w-[200px] py-2.5 pr-4">
                  <span className="block truncate text-xs text-muted-foreground">
                    {log.page_url.replace(/^https?:\/\/[^/]+/, "")}
                  </span>
                </td>
                <td className="max-w-[300px] py-2.5 pr-4">
                  <span className="block truncate">
                    {log.error_message.slice(0, 100)}
                    {log.error_message.length > 100 && "…"}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                  {log.email ?? "비로그인"}
                </td>
                <td className="py-2.5">
                  <button
                    onClick={(e) => handleDelete(log.id, e)}
                    disabled={deletingId === log.id && isPending}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>에러 상세</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  발생 시각
                </p>
                <p>
                  {format(new Date(selected.created_at), "yyyy.M.d HH:mm:ss", {
                    locale: ko,
                  })}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  페이지 URL
                </p>
                <p className="break-all text-xs">{selected.page_url}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  에러 메시지
                </p>
                <p className="whitespace-pre-wrap break-all rounded-md bg-destructive/10 p-3 text-destructive">
                  {selected.error_message}
                </p>
              </div>
              {selected.stack_trace && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Stack Trace
                  </p>
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs leading-relaxed">
                    {selected.stack_trace}
                  </pre>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-6">
                  <span>사용자: {selected.email ?? "비로그인"}</span>
                  {selected.user_agent && (
                    <span className="max-w-xs truncate">
                      {selected.user_agent}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(selected.id)}
                  disabled={deletingId === selected.id && isPending}
                  className="h-7 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
