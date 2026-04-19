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
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        <CopyButton text={localValue} />
      </div>
      <Textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        rows={8}
        className="resize-none font-mono text-sm"
      />
    </div>
  );
}
