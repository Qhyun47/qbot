"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseTimeTag } from "@/lib/time/parse-time-tag";

interface CardInputBarProps {
  onSubmit: (
    rawText: string,
    timeTag: string | null,
    timeOffsetMinutes: number | null
  ) => void;
}

export function CardInputBar({ onSubmit }: CardInputBarProps) {
  const [text, setText] = useState("");
  const parsed = parseTimeTag(text);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim(), parsed.timeTag, parsed.timeOffsetMinutes);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 flex flex-col gap-1 border-t bg-background p-3">
      {parsed.timeTag && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>시간 감지:</span>
          <Badge variant="outline" className="text-xs">
            {parsed.timeTag}
          </Badge>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="문진 키워드를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
          className="flex-1 resize-none"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!text.trim()}
          aria-label="전송"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
