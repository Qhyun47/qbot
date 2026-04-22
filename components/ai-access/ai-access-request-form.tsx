"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { requestAiAccess } from "@/lib/ai-access/actions";
import type { AiAccessStatus } from "@/lib/supabase/types";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<AiAccessStatus, string> = {
  none: "미신청",
  pending: "심사 중",
  approved: "승인됨",
  denied: "거부됨",
};

const STATUS_VARIANTS: Record<
  AiAccessStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  none: "outline",
  pending: "secondary",
  approved: "default",
  denied: "destructive",
};

interface AiAccessRequestFormProps {
  status: AiAccessStatus;
  currentName?: string | null;
}

export function AiAccessRequestForm({
  status,
  currentName,
}: AiAccessRequestFormProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName ?? "");
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
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">현재 상태</span>
        <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
      </div>

      {status === "approved" && (
        <p className="text-sm text-muted-foreground">
          AI 차팅 기능을 사용할 수 있습니다.
        </p>
      )}

      {status === "pending" && (
        <p className="text-sm text-muted-foreground">
          신청이 접수되었습니다. 관리자 검토 후 승인 처리됩니다.
        </p>
      )}

      {(status === "none" || status === "denied") && (
        <div className="flex flex-col gap-3">
          {status === "denied" && (
            <p className="text-sm text-destructive">
              이전 신청이 거부되었습니다. 아래에서 다시 신청하실 수 있습니다.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-ai-name">이름</Label>
            <Input
              id="settings-ai-name"
              placeholder="실명을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRequest()}
              disabled={isPending}
              className="max-w-xs"
            />
          </div>
          <Button
            onClick={handleRequest}
            disabled={isPending || !name.trim()}
            className="w-fit"
          >
            {isPending ? "신청 중..." : "AI 사용 신청하기"}
          </Button>
        </div>
      )}
    </div>
  );
}
