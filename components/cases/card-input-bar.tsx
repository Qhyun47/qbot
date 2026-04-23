"use client";

import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseTimeTag } from "@/lib/time/parse-time-tag";
import { cn } from "@/lib/utils";

interface CardInputBarProps {
  onSubmit: (
    rawText: string,
    timeTag: string | null,
    timeOffsetMinutes: number | null
  ) => void;
}

export function CardInputBar({ onSubmit }: CardInputBarProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const parsed = parseTimeTag(text);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    autoResize(e.target);
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), parsed.timeTag, parsed.timeOffsetMinutes);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      {parsed.timeTag && (
        <div className="flex items-center gap-1.5 border-b bg-blue-50 px-3 py-1.5 text-xs dark:bg-blue-950">
          <span className="text-muted-foreground">감지된 시간:</span>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {parsed.timeTag}
          </span>
        </div>
      )}
      <div className="flex items-end gap-2 p-3">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="문진 정보 입력"
          className={cn(
            "flex-1 resize-none overflow-hidden text-sm transition-colors",
            "min-h-0 focus-visible:ring-1 focus-visible:ring-foreground"
          )}
        />
        <Button
          size="icon"
          onPointerDown={(e) => {
            e.preventDefault(); // 버튼이 포커스를 가져가지 않아 키보드가 유지됨
            handleSubmit();
          }}
          disabled={!text.trim()}
          aria-label="전송"
          className="shrink-0"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
