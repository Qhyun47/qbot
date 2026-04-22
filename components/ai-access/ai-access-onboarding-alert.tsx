"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestAiAccess, dismissAiAccessAlert } from "@/lib/ai-access/actions";

interface AiAccessOnboardingAlertProps {
  initialOpen?: boolean;
}

export function AiAccessOnboardingAlert({
  initialOpen = true,
}: AiAccessOnboardingAlertProps) {
  const [open, setOpen] = useState(initialOpen);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleRequest() {
    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    startTransition(async () => {
      const result = await requestAiAccess(name);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          "AI 사용 신청이 완료되었습니다. 관리자 승인을 기다려주세요."
        );
        setOpen(false);
      }
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissAiAccessAlert();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>AI 차팅 사용 허가 안내</DialogTitle>
          <DialogDescription>
            규봇의 AI 차팅 기능은 관리자의 허가가 필요합니다. 아래에 이름을
            입력하고 신청하시면 관리자가 검토 후 승인해드립니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-access-name">이름</Label>
            <Input
              id="ai-access-name"
              placeholder="실명을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRequest()}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isPending}
            className="text-muted-foreground"
          >
            더 이상 보지 않기
          </Button>
          <Button onClick={handleRequest} disabled={isPending || !name.trim()}>
            {isPending ? "처리 중..." : "신청하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
