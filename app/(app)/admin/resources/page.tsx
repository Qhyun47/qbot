import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { buildResourceOverview } from "@/lib/admin/resource-reader";
import { ResourceOverview } from "@/components/admin/resource-overview";
import { Skeleton } from "@/components/ui/skeleton";

async function ResourceContent() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const data = await buildResourceOverview();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {data.pendingMatches.length > 0 && (
        <div className="shrink-0 border-b px-4 py-2">
          <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>
              미매칭 C.C. {data.pendingMatches.length}개:{" "}
              {data.pendingMatches.join(", ")}
            </span>
          </div>
        </div>
      )}
      <ResourceOverview data={data} />
    </div>
  );
}

export default function AdminResourcesPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="shrink-0 border-b px-4 py-3">
        <h1 className="text-sm font-semibold">AI 리소스 현황</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          C.C., 가이드라인, 상용구 등록 현황 및 매칭 상태
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-1 overflow-hidden">
            <div className="hidden w-56 shrink-0 flex-col gap-2 border-r p-3 md:flex">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        }
      >
        <ResourceContent />
      </Suspense>
    </div>
  );
}
