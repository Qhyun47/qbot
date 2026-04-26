import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AlertTriangle, Brain } from "lucide-react";
import { MarkdownPreview } from "@/components/ui/markdown-preview";

interface MedicationAnalysisSectionProps {
  antithromboticCheck: string | null;
  antithromboticAt: string | null;
  underlyingDisease: string | null;
  underlyingDiseaseAt: string | null;
}

function timeAgo(isoString: string | null): string {
  if (!isoString) return "";
  return formatDistanceToNow(new Date(isoString), {
    addSuffix: true,
    locale: ko,
  });
}

export function MedicationAnalysisSection({
  antithromboticCheck,
  antithromboticAt,
  underlyingDisease,
  underlyingDiseaseAt,
}: MedicationAnalysisSectionProps) {
  if (!antithromboticCheck && !underlyingDisease) return null;

  return (
    <div className="flex flex-col gap-3">
      {antithromboticCheck && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                AI 주의 약물 분석
              </h3>
            </div>
            {antithromboticAt && (
              <span className="text-xs text-red-600/60 dark:text-red-400/60">
                {timeAgo(antithromboticAt)}
              </span>
            )}
          </div>
          <MarkdownPreview content={antithromboticCheck} />
        </div>
      )}
      {underlyingDisease && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">AI 기저질환 추정</h3>
            </div>
            {underlyingDiseaseAt && (
              <span className="text-xs text-muted-foreground">
                {timeAgo(underlyingDiseaseAt)}
              </span>
            )}
          </div>
          <MarkdownPreview content={underlyingDisease} />
        </div>
      )}
    </div>
  );
}
