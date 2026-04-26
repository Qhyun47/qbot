"use client";

import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownPreview } from "@/components/ui/markdown-preview";

interface DiseaseAnalysisCardProps {
  medList: string;
  defaultPastHx?: string;
  caseId?: string;
}

export function DiseaseAnalysisCard({
  medList,
  defaultPastHx = "",
  caseId,
}: DiseaseAnalysisCardProps) {
  const [loading, setLoading] = useState(false);
  const [knownDisease, setKnownDisease] = useState(defaultPastHx);
  const [result, setResult] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await fetch("/api/medication/analyze-disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medList, knownDisease, caseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "분석 중 오류가 발생했습니다.");
        return;
      }
      setResult(data.result);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
          <Brain className="size-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-semibold">기저질환 추정</h3>
      </div>

      <div className="mb-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="known-disease" className="text-sm">
            환자의 기저질환 (선택)
          </Label>
          <span className="text-xs text-muted-foreground">
            분석 정확도 향상
          </span>
        </div>
        <Input
          id="known-disease"
          value={knownDisease}
          onChange={(e) => setKnownDisease(e.target.value)}
          placeholder="예: 고혈압, 당뇨, 만성 신질환 등"
          className="text-sm"
        />
      </div>

      <Button
        className="w-full gap-1.5"
        onClick={handleAnalyze}
        disabled={!medList || loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            분석 중...
          </>
        ) : result ? (
          "재추정"
        ) : (
          "추정 시작하기"
        )}
      </Button>

      {result && (
        <div className="mt-4 rounded-lg border bg-muted/30 p-3">
          <MarkdownPreview content={result} />
        </div>
      )}
    </div>
  );
}
