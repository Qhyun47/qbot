"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { upsertGuideline, deleteGuideline } from "@/lib/guidelines/actions";
import type { Guideline } from "@/lib/supabase/types";

interface CcItem {
  cc: string;
  guideKeys: string[];
  templateKeys: string[];
  aliasOf?: string;
}

interface GuidelinesEditorProps {
  ccList: CcItem[];
  initialGuidelines: Guideline[];
  systemGuides: Record<string, string>;
}

export function GuidelinesEditor({
  ccList,
  initialGuidelines,
  systemGuides,
}: GuidelinesEditorProps) {
  const primaryList = ccList.filter((item) => !item.aliasOf);
  const [selectedCc, setSelectedCc] = useState(primaryList[0]?.cc ?? "");
  const [customGuidelines, setCustomGuidelines] =
    useState<Guideline[]>(initialGuidelines);
  const [, startTransition] = useTransition();

  const currentCustom =
    customGuidelines.find((g) => g.cc === selectedCc)?.content ?? "";
  const [customContent, setCustomContent] = useState(currentCustom);

  function handleCcChange(cc: string) {
    setSelectedCc(cc);
    const existing = customGuidelines.find((g) => g.cc === cc);
    setCustomContent(existing?.content ?? "");
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const saved = await upsertGuideline(selectedCc, customContent);
        setCustomGuidelines((prev) => {
          const next = prev.filter((g) => g.cc !== selectedCc);
          return [...next, saved].sort((a, b) => a.cc.localeCompare(b.cc));
        });
        toast.success("가이드라인이 저장되었습니다.");
      } catch {
        toast.error("저장에 실패했습니다.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteGuideline(selectedCc);
        setCustomGuidelines((prev) => prev.filter((g) => g.cc !== selectedCc));
        setCustomContent("");
        toast.success("가이드라인이 삭제되었습니다.");
      } catch {
        toast.error("삭제에 실패했습니다.");
      }
    });
  }

  const systemContent = systemGuides[selectedCc] ?? "";

  return (
    <div className="space-y-6">
      {/* C.C 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="cc-select" className="text-sm font-medium">
          Chief Complaint 선택
        </Label>
        <Select value={selectedCc} onValueChange={handleCcChange}>
          <SelectTrigger id="cc-select" className="w-full max-w-sm">
            <SelectValue placeholder="C.C를 선택하세요" />
          </SelectTrigger>
          <SelectContent position="popper">
            {primaryList.map((item) => (
              <SelectItem key={item.cc} value={item.cc}>
                {item.cc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 에디터 영역 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">시스템 기본 가이드라인</p>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              읽기 전용
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border bg-muted/50 p-4">
            {systemContent ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                {systemContent}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                이 C.C.에 대한 시스템 기본 가이드라인이 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">커스텀 가이드라인 편집</p>
          <Textarea
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder="Markdown 형식으로 커스텀 가이드라인을 작성하세요..."
            className="min-h-72 resize-none font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="gap-1.5"
              disabled={!customContent.trim()}
            >
              <Save className="size-3.5" />
              저장
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!currentCustom}
            >
              <Trash2 className="size-3.5" />
              삭제
            </Button>
          </div>
        </div>
      </div>

      {/* 커스텀 현황 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">커스텀 설정 현황</p>
        <div className="rounded-lg border bg-card p-4">
          {customGuidelines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              저장된 커스텀 가이드라인이 없습니다.
            </p>
          ) : (
            <ul className="space-y-1">
              {customGuidelines.map((g) => (
                <li key={g.cc} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{g.cc}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="truncate text-muted-foreground">
                    {g.content.slice(0, 60)}
                    {g.content.length > 60 ? "..." : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
