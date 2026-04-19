"use client";

import { useState } from "react";
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
import { MOCK_GUIDE_CONTENT } from "@/lib/mock/cases";

interface CcItem {
  cc: string;
  hasTemplate: boolean;
  templateKey: string;
  aliasOf?: string;
}

interface GuidelinesEditorProps {
  ccList: CcItem[];
}

export function GuidelinesEditor({ ccList }: GuidelinesEditorProps) {
  const primaryList = ccList.filter((item) => !item.aliasOf);
  const [selectedCc, setSelectedCc] = useState(primaryList[0]?.cc ?? "");
  const [customContent, setCustomContent] = useState("");

  function handleSave() {
    toast.success("가이드라인이 저장되었습니다.");
  }

  function handleDelete() {
    setCustomContent("");
    toast.success("가이드라인이 삭제되었습니다.");
  }

  return (
    <div className="space-y-6">
      {/* C.C 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="cc-select" className="text-sm font-medium">
          Chief Complaint 선택
        </Label>
        <Select value={selectedCc} onValueChange={setSelectedCc}>
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
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
              {MOCK_GUIDE_CONTENT}
            </pre>
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
            <Button onClick={handleSave} size="sm" className="gap-1.5">
              <Save className="size-3.5" />
              저장
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="gap-1.5"
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
          <p className="text-sm text-muted-foreground">
            저장된 커스텀 가이드라인이 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
