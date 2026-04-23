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
}

export function ResultSection({
  title,
  value,
  onSave,
  className,
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
