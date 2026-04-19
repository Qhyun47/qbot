"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/cases/copy-button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ResultSectionProps {
  title: string;
  value: string;
  className?: string;
}

export function ResultSection({ title, value, className }: ResultSectionProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div
      className={cn(
        "shadow-xs flex flex-col overflow-hidden rounded-lg border bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <CopyButton text={localValue} label={`${title} 복사`} />
      </div>
      <Textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        rows={9}
        className="resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}
