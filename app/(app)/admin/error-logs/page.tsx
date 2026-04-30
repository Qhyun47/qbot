"use client";

import { useState, useTransition, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorLogTable } from "@/components/admin/error-log-table";
import {
  getErrorLogs,
  deleteErrorLog,
  deleteAllErrorLogs,
  type ErrorLogWithEmail,
} from "@/lib/admin/error-log-actions";

export default function AdminErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLogWithEmail[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getErrorLogs().then(setLogs);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteErrorLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleDeleteAll = () => {
    startTransition(async () => {
      await deleteAllErrorLogs();
      setLogs([]);
    });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold">에러 로그</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            사용자가 제출한 에러 로그를 확인합니다. 최근 200건 표시.
          </p>
        </div>
        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAll}
            disabled={isPending}
            className="h-7 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            전체 삭제
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        <ErrorLogTable logs={logs} onDelete={handleDelete} />
      </div>
    </div>
  );
}
