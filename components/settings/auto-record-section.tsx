"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateAutoRecord } from "@/lib/settings/actions";

interface AutoRecordSectionProps {
  defaultAutoRecord: boolean;
}

export function AutoRecordSection({
  defaultAutoRecord,
}: AutoRecordSectionProps) {
  const [enabled, setEnabled] = useState(defaultAutoRecord);

  async function handleToggle(value: boolean) {
    setEnabled(value);
    try {
      await updateAutoRecord(value);
    } catch {
      setEnabled(!value);
      toast.error("저장에 실패했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">자동 녹음</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          문진 시작 시 자동으로 녹음을 켤지 설정합니다.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">문진 시작 시 자동 녹음</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            켜면 환자 추가 확인 시 자동으로 녹음이 시작됩니다.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          aria-label="문진 시작 시 자동 녹음"
        />
      </div>
    </div>
  );
}
