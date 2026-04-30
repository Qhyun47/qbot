"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCaseCcs } from "@/lib/cases/actions";
import ccList from "@/lib/ai/resources/cc-list.json";
import type { CcListEntry } from "@/lib/ai/resources/cc-types";
import { getPrimaryKey } from "@/lib/ai/resources/cc-types";

interface CcRetryFormProps {
  caseId: string;
  currentCc: string | null;
}

export function CcRetryForm({ caseId, currentCc }: CcRetryFormProps) {
  const router = useRouter();
  const [cc, setCc] = useState(currentCc ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cc.trim()) return;

    setLoading(true);
    try {
      const list = ccList as CcListEntry[];
      const found = list.find(
        (item) => item.cc.toLowerCase() === cc.trim().toLowerCase()
      );
      const resolved = found?.aliasOf
        ? (list.find((i) => i.cc === found.aliasOf) ?? found)
        : found;
      const templateKey =
        getPrimaryKey(resolved?.templateKeys ?? []) ??
        resolved?.templateKeys?.[0]?.key ??
        null;
      await updateCaseCcs(caseId, [cc.trim()], templateKey);
      const res = await fetch(`/api/cases/${caseId}/generate`, {
        method: "POST",
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        alert(
          data.error ??
            "오늘 AI 차팅 생성 한도(30회)를 초과했습니다. 내일 다시 시도해주세요."
        );
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
    <div className="flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-10 text-center dark:border-red-800 dark:bg-red-950/30">
      <AlertCircle className="size-9 text-red-500" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-red-700 dark:text-red-400">
          차팅 생성 실패
        </p>
        <p className="text-sm text-red-600/80 dark:text-red-500/80">
          C.C.를 입력하면 다시 생성할 수 있습니다.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs gap-2">
        <Input
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="예: Chest pain"
          className="h-9 bg-white dark:bg-zinc-900"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading || !cc.trim()}>
          {loading ? "생성 중..." : "재생성"}
        </Button>
      </form>
    </div>
  );
}
