"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegenerateButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRegenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/generate`, {
        method: "POST",
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        alert(
          data.error ??
            "오늘 AI 차팅 생성 한도(30회)를 초과했습니다. 내일 다시 시도해주세요."
        );
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto gap-1.5"
      onClick={handleRegenerate}
      disabled={loading}
    >
      <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      재생성
    </Button>
  );
}
