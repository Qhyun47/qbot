import { Suspense } from "react";
import guideList from "@/lib/ai/resources/guide-list.json";
import { GuidelinesEditor } from "@/components/guidelines/guidelines-editor";
import { getAllCustomGuidelines } from "@/lib/guidelines/actions";
import { loadGuide } from "@/lib/ai/load-resources";

async function GuidelinesContent() {
  const initialGuidelines = await getAllCustomGuidelines();

  const systemGuides: Record<string, string> = {};
  for (const item of guideList) {
    try {
      const guide = loadGuide(item.guideKey);
      if (guide) systemGuides[item.guideKey] = guide;
    } catch {
      // 가이드 파일 없으면 스킵
    }
  }

  return (
    <GuidelinesEditor
      guideList={guideList}
      initialGuidelines={initialGuidelines}
      systemGuides={systemGuides}
    />
  );
}

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
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        }
      >
        <GuidelinesContent />
      </Suspense>
    </div>
  );
}
