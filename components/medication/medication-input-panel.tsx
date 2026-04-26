"use client";

import { Play, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MedicationInputPanelProps {
  rawText: string;
  onRawTextChange: (text: string) => void;
  excludeEnded: boolean;
  onExcludeEndedChange: (v: boolean) => void;
  includeDetails: boolean;
  onIncludeDetailsChange: (v: boolean) => void;
  onOrganize: () => void;
  onReset: () => void;
}

export function MedicationInputPanel({
  rawText,
  onRawTextChange,
  excludeEnded,
  onExcludeEndedChange,
  includeDetails,
  onIncludeDetailsChange,
  onOrganize,
  onReset,
}: MedicationInputPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex min-h-8 items-center gap-2">
        <h2 className="flex-1 truncate text-sm font-semibold">
          <span className="mr-1.5 text-muted-foreground">①</span>
          복사한 의약품 원문 입력
        </h2>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          REQUIRED
        </span>
      </div>

      <Textarea
        value={rawText}
        onChange={(e) => onRawTextChange(e.target.value)}
        rows={14}
        placeholder={
          "입력 예시:\n20260319 641806960 네비레트엠정2.5밀리그램(네비보롤염산염)_(2.725mg/1정)...\n  643308030 리퀴시아정5밀리그램(아픽사반)_(5mg/1정)...\n  650200400 레보텐션정2.5밀리그램(S-암로디핀베실산염2.5수화물)_(3.74mg/1정)...\n20260121 654004930 도베셀정500밀리그램(도베실산칼슘수화물)_(0.5g/1정)...\n  665600241 산텐미드린피점안액_(10mL) phenylephrine hydrochloride포함 복합제(2성분).."
        }
        className="flex-1 resize-none font-mono text-sm"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <Label
              htmlFor="exclude-ended"
              className="cursor-pointer text-sm font-medium"
            >
              복용 종료 약물 제외
            </Label>
            <p className="text-xs text-muted-foreground">
              처방 기간이 지난 약물을 자동으로 숨깁니다 (KST)
            </p>
          </div>
          <Switch
            id="exclude-ended"
            checked={excludeEnded}
            onCheckedChange={onExcludeEndedChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label
              htmlFor="include-details"
              className="cursor-pointer text-sm font-medium"
            >
              처방 상세 정보 포함
            </Label>
            <p className="text-xs text-muted-foreground">
              투약량, 함량, 횟수, 일수를 함께 표시합니다
            </p>
          </div>
          <Switch
            id="include-details"
            checked={includeDetails}
            onCheckedChange={onIncludeDetailsChange}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onOrganize} className="flex-1 gap-1.5">
          <Play className="size-3.5" />
          목록 정리하기
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="shrink-0 gap-1.5"
        >
          <Trash2 className="size-3.5" />
          초기화
        </Button>
      </div>
    </div>
  );
}
