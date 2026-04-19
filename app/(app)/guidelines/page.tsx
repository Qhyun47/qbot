import ccList from "@/lib/ai/resources/cc-list.json";
import { GuidelinesEditor } from "@/components/guidelines/guidelines-editor";

export default function GuidelinesPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">가이드라인 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          C.C.별 문진 가이드라인을 커스텀하세요. 커스텀 가이드라인이 시스템
          기본보다 우선 적용됩니다.
        </p>
      </div>
      <GuidelinesEditor ccList={ccList} />
    </div>
  );
}
