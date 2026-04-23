import { Suspense } from "react";
import { CasesTable } from "@/components/cases/cases-table";
import { listCasesWithin12h } from "@/lib/cases/queries";
import { RealtimeRefresh } from "@/components/cases/realtime-refresh";

async function CasesLoader() {
  const cases = await listCasesWithin12h();
  return (
    <>
      <p className="mt-1 text-sm text-muted-foreground">
        최근 24시간 · {cases.length}개 케이스
      </p>
      <div className="mt-6">
        <CasesTable cases={cases} />
      </div>
    </>
  );
}

export default function CasesPage() {
  return (
    <div className="p-4 md:p-8">
      <RealtimeRefresh table="cases" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">케이스 목록</h1>
        <Suspense
          fallback={
            <p className="mt-1 text-sm text-muted-foreground">불러오는 중...</p>
          }
        >
          <CasesLoader />
        </Suspense>
      </div>
    </div>
  );
}
