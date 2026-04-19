"use client";

import { useState } from "react";
import { toast } from "sonner";
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
}

interface GuidelinesEditorProps {
  ccList: CcItem[];
}

export function GuidelinesEditor({ ccList }: GuidelinesEditorProps) {
  const [selectedCc, setSelectedCc] = useState(ccList[0]?.cc ?? "");
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
      <div className="space-y-1.5">
        <Label htmlFor="cc-select">Chief Complaint</Label>
        <Select value={selectedCc} onValueChange={setSelectedCc}>
          <SelectTrigger id="cc-select" className="w-full max-w-xs">
            <SelectValue placeholder="C.C를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {ccList.map((item) => (
              <SelectItem key={item.cc} value={item.cc}>
                {item.cc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            시스템 기본 가이드라인 (읽기 전용)
          </p>
          <div className="max-h-64 overflow-y-auto rounded border bg-muted p-3">
            <pre className="whitespace-pre-wrap text-sm">
              {MOCK_GUIDE_CONTENT}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">커스텀 가이드라인 편집</p>
          <Textarea
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder="Markdown 형식으로 커스텀 가이드라인을 작성하세요..."
            className="min-h-48 resize-y font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              저장
            </Button>
            <Button onClick={handleDelete} variant="outline" size="sm">
              삭제
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">커스텀 가이드라인 현황</p>
        <div className="rounded border p-4">
          <p className="text-sm text-muted-foreground">
            저장된 커스텀 가이드라인이 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
