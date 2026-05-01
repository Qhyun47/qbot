"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { MedicationInputPanel } from "@/components/medication/medication-input-panel";
import { MedicationResultPanel } from "@/components/medication/medication-result-panel";
import { WarningAnalysisCard } from "@/components/medication/warning-analysis-card";
import { DiseaseAnalysisCard } from "@/components/medication/disease-analysis-card";
import { processMedicationText } from "@/lib/medication/parser";
import { appendMedListToCase } from "@/lib/medication/actions";

interface MedicationOrganizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId?: string;
  defaultPastHx?: string;
  currentHistory?: string;
}

export function MedicationOrganizerDialog({
  open,
  onOpenChange,
  caseId,
  defaultPastHx,
  currentHistory: _currentHistory,
}: MedicationOrganizerDialogProps) {
  const [rawText, setRawText] = useState("");
  const [organizedText, setOrganizedText] = useState("");
  const [excludeEnded, setExcludeEnded] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("medication-include-details");
    return stored === null ? true : stored === "true";
  });

  function handleIncludeDetailsChange(value: boolean) {
    setIncludeDetails(value);
    localStorage.setItem("medication-include-details", String(value));
  }

  function handleOrganize() {
    const result = processMedicationText(rawText, {
      filterActive: excludeEnded,
      includeDetails,
    });
    setOrganizedText(result);
  }

  function handleReset() {
    setRawText("");
    setOrganizedText("");
    setExcludeEnded(true);
  }

  async function handleAddToHistory() {
    if (!caseId || !organizedText) return;
    try {
      await appendMedListToCase(caseId, organizedText);
      toast.success("History에 약물 목록이 추가되었습니다.");
      onOpenChange(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "저장 중 오류가 발생했습니다."
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[90vw] max-w-[90vw] flex-col overflow-hidden p-0 sm:max-w-[1200px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>의약품 정리</DialogTitle>
        </DialogHeader>
        {!caseId && (
          <div className="flex items-start gap-2.5 border-b bg-muted/60 px-6 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              환자 페이지에서 의약품 정리를 이용하면 정리된 약물 목록을{" "}
              <span className="font-medium text-foreground">
                차팅(History)에 바로 추가
              </span>
              하고,{" "}
              <span className="font-medium text-foreground">
                AI 분석 결과를 케이스에 저장
              </span>
              할 수 있습니다.
            </p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 min-[920px]:grid-cols-2">
            <MedicationInputPanel
              rawText={rawText}
              onRawTextChange={setRawText}
              excludeEnded={excludeEnded}
              onExcludeEndedChange={setExcludeEnded}
              includeDetails={includeDetails}
              onIncludeDetailsChange={handleIncludeDetailsChange}
              onOrganize={handleOrganize}
              onReset={handleReset}
            />
            <MedicationResultPanel
              organizedText={organizedText}
              caseId={caseId}
              onAddToHistory={handleAddToHistory}
            />
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                AI 임상 지원 도구
              </span>
              <Separator className="flex-1" />
            </div>
            <WarningAnalysisCard medList={organizedText} caseId={caseId} />
            <DiseaseAnalysisCard
              medList={organizedText}
              defaultPastHx={defaultPastHx}
              caseId={caseId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
