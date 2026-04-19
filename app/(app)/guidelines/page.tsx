import ccList from "@/lib/ai/resources/cc-list.json";
import { GuidelinesEditor } from "@/components/guidelines/guidelines-editor";

export default function GuidelinesPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-6 text-xl font-semibold">가이드라인 관리</h1>
      <GuidelinesEditor ccList={ccList} />
    </div>
  );
}
