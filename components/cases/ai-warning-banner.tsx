import { TriangleAlert } from "lucide-react";

export function AiWarningBanner() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
      <TriangleAlert className="size-3.5 shrink-0" />
      <span>
        AI 생성 내용입니다. 부정확하니 사용 전 반드시 직접 검토하세요.
      </span>
    </div>
  );
}
