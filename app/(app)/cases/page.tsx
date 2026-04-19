import { MOCK_CASES } from "@/lib/mock/cases";
import { CasesTable } from "@/components/cases/cases-table";

export default function CasesPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">케이스 목록</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          총 {MOCK_CASES.length}개의 케이스
        </p>
      </div>
      <CasesTable cases={MOCK_CASES} />
    </div>
  );
}
