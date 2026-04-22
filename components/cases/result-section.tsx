"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { CopyButton } from "@/components/cases/copy-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ResultSectionProps {
  title: string;
  value: string;
  onSave?: (text: string) => void;
  className?: string;
  /** 헤더 영역 복사 버튼 옆에 추가로 렌더링할 슬롯 (예: 교정 버튼) */
  correctionSlot?: React.ReactNode;
}

export function ResultSection({
  title,
  value,
  onSave,
  className,
  correctionSlot,
}: ResultSectionProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedSave = useDebouncedCallback((text: string) => {
    onSave?.(text);
  }, 500);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setLocalValue(e.target.value);
    debouncedSave(e.target.value);
  }

  return (
    <div
      className={cn(
        "shadow-xs flex flex-col overflow-hidden rounded-lg border bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="flex items-center gap-1">
          {correctionSlot}
          <CopyButton text={localValue} label={`${title} 복사`} />
        </div>
      </div>
      <Textarea
        value={localValue}
        onChange={handleChange}
        rows={9}
        className="resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}
