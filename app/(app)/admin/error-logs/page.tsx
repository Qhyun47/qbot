import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getErrorLogs } from "@/lib/admin/error-log-actions";
import { ErrorLogTable } from "@/components/admin/error-log-table";
import { Skeleton } from "@/components/ui/skeleton";

async function ErrorLogContent() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const logs = await getErrorLogs();

  return (
    <div className="p-4">
      <ErrorLogTable logs={logs} />
    </div>
  );
}

export default function AdminErrorLogsPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b px-4 py-3">
        <h1 className="text-sm font-semibold">에러 로그</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          사용자가 제출한 에러 로그를 확인합니다. 최근 200건 표시.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        }
      >
        <ErrorLogContent />
      </Suspense>
    </div>
  );
}
