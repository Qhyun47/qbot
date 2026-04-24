"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "ai-disclaimer-v1";
const TTL_MS = 20 * 60 * 60 * 1000; // 20시간

function shouldShow(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    return Date.now() - ts > TTL_MS;
  } catch {
    return true;
  }
}

function markAccepted() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // 무시
  }
}

export function AiDisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (shouldShow()) setOpen(true);
  }, []);

  function handleConfirm() {
    markAccepted();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
              <AlertTriangle className="size-7 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-base">
              AI 생성 결과 주의사항
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>이 서비스는 AI가 작성한 차팅 초안을 제공합니다.</p>
          <ul className="flex flex-col gap-1.5 pl-1">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-amber-500">•</span>
              <span>
                AI 생성 내용은{" "}
                <strong className="text-foreground">부정확하거나 누락</strong>될
                수 있습니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-amber-500">•</span>
              <span>
                실제 진료 기록으로 사용하기 전{" "}
                <strong className="text-foreground">
                  반드시 직접 검토·수정
                </strong>
                이 필요합니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-amber-500">•</span>
              <span>
                무분별한 사용으로 인해 문제가 발생하여 규봇 사용에 제약이
                걸린다면 전 너무나도 슬플 것 같습니다..
              </span>
            </li>
          </ul>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border p-3">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-snug">
            위 내용을 이해하고 동의합니다.
          </span>
        </label>

        <Button onClick={handleConfirm} disabled={!checked} className="w-full">
          확인
        </Button>
      </DialogContent>
    </Dialog>
  );
}
