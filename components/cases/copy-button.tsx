"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

export function CopyButton({
  text,
  className,
  label = "복사",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한 거부 또는 HTTPS 미적용 환경
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-1.5 text-xs transition-all",
        copied &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
        className
      )}
      onClick={handleCopy}
      aria-label={copied ? "복사됨" : label}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "복사됨" : label}
    </Button>
  );
}
