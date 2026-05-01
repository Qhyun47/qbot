"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  if (isGenerating) {
    return (
      <Button variant="outline" size="sm" className="ml-auto gap-1.5" disabled>
        <Loader2 className="size-3.5 animate-spin" />
        생성 중…
      </Button>
    );
  }

  if (status === "draft") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="ml-auto gap-1.5"
        onClick={handleRegenerate}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        차팅 생성
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto gap-1.5"
      onClick={handleRegenerate}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <RefreshCw className="size-3.5" />
      )}
      재생성
    </Button>
  );
}
