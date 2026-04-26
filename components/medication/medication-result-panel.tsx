"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/cases/copy-button";
import { History } from "lucide-react";

interface MedicationResultPanelProps {
  organizedText: string;
  caseId?: string;
  onAddToHistory?: () => void;
}

export function MedicationResultPanel({
  organizedText,
  caseId,
  onAddToHistory,
}: MedicationResultPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="min-w-0 shrink truncate text-sm font-semibold">
          <span className="mr-1.5 text-muted-foreground">②</span>
          정리된 약물 목록
        </h2>
        <CopyButton
          text={organizedText}
          label="전체 복사하기"
          className="shrink-0"
        />
      </div>

      <Textarea
        value={organizedText}
        readOnly
        rows={14}
        placeholder="원문을 입력하고 '목록 정리하기'를 눌러주세요."
        className="flex-1 resize-none font-mono text-sm"
      />

      {caseId && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={onAddToHistory}
            disabled={!organizedText}
          >
            <History className="size-3.5" />
            History에 추가
          </Button>
        </div>
      )}
    </div>
  );
}
