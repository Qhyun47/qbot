"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { CaseStatus } from "@/lib/supabase/types";

export function RegenerateButton({
  caseId,
  status,
}: {
  caseId: string;
  status: CaseStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isGenerating = status === "generating";

  async function handleRegenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/generate`, {
        method: "POST",
      });
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "AI 기능은 사용이 제한되어 있습니다.");
        return;
      }
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "일일 생성 한도를 초과했습니다.");
        return;
      }
      router.refresh();
    } catch {
      toast.error("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  const label = isGenerating
    ? "생성 중…"
    : status === "draft"
      ? "차팅 생성"
      : "재생성";

  const icon =
    isGenerating || loading ? (
      <Loader2 className="size-3.5 animate-spin" />
    ) : status === "draft" ? (
      <Sparkles className="size-3.5" />
    ) : (
      <RefreshCw className="size-3.5" />
    );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={isGenerating ? undefined : handleRegenerate}
            disabled={isGenerating || loading}
            className="inline-flex gap-1.5"
          >
            {icon}
            <span className="hidden xl:inline">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="xl:hidden">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
