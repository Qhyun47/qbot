"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveCorrection } from "@/lib/corrections/actions";

interface CorrectionModalProps {
  trigger: React.ReactNode;
  sectionType: "pi" | "template" | "history" | "pe";
  sectionLabel: string; // 'P.I', '상용구', 'P/E', 'History'
  cc: string;
  templateKey?: string;
  caseId: string;
  caseInputsJson: unknown;
  apiOutput: string;
}

export function CorrectionModal({
  trigger,
  sectionType,
  sectionLabel,
  cc,
  templateKey,
  caseId,
  caseInputsJson,
  apiOutput,
}: CorrectionModalProps) {
  const [open, setOpen] = useState(false);
  const [correctedOutput, setCorrectedOutput] = useState("");
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCorrectedOutput("");
      setComment("");
    }
    setOpen(nextOpen);
  }

  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await saveCorrection({
        caseId,
        sectionType,
        cc,
        templateKey,
        caseInputsJson,
        apiOutput,
        correctedOutput,
        comment: comment.trim() || undefined,
      });

      toast.success(`${sectionLabel} 교정이 저장되었습니다.`);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "교정 저장 중 오류가 발생했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="w-[90vw] max-w-5xl bg-white dark:bg-zinc-950 sm:max-w-5xl"
        overlayClassName="bg-transparent"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>{sectionLabel} 교정</DialogTitle>
        </DialogHeader>

        {/* AI 작성 vs 교정 버전 나란히 표시 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-muted-foreground">
              AI 작성
            </Label>
            <Textarea
              value={apiOutput}
              readOnly
              rows={14}
              className="resize-none bg-muted font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">교정 버전</Label>
            <Textarea
              value={correctedOutput}
              onChange={(e) => setCorrectedOutput(e.target.value)}
              rows={14}
              className="resize-none font-mono text-sm"
            />
          </div>
        </div>

        {/* 추가 요청사항 (스타일 규칙으로 저장됨) */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-muted-foreground">
            추가 요청사항
            <span className="ml-1 text-xs opacity-70">
              (저장 시 스타일 규칙으로 등록됩니다)
            </span>
          </Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="예: HTN, DM처럼 약어를 사용하고 Hypertension처럼 길게 쓰지 않습니다."
            className="resize-none text-sm"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
