import { MOCK_CASES } from "@/lib/mock/cases";
import { CasesTable } from "@/components/cases/cases-table";

export default function CasesPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-6 text-xl font-semibold">케이스 목록</h1>
      <CasesTable cases={MOCK_CASES} />
    </div>
  );
}
