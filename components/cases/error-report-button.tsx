"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitErrorLog } from "@/lib/errors/actions";

interface ErrorReportButtonProps {
  errorMessage: string;
}

export function ErrorReportButton({ errorMessage }: ErrorReportButtonProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleReport = async () => {
    if (status !== "idle") return;
    setStatus("sending");
    await submitErrorLog({
      pageUrl: window.location.href,
      errorMessage: `[차팅 생성 실패] ${errorMessage}`,
    });
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <p className="text-xs text-red-500/60 dark:text-red-400/50">
        관리자에게 전달되었습니다.
      </p>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 text-xs text-red-500/50 hover:bg-transparent hover:text-red-500 dark:text-red-400/40 dark:hover:text-red-400"
      onClick={handleReport}
      disabled={status === "sending"}
    >
      {status === "sending" ? "전송 중..." : "관리자에게 알리기"}
    </Button>
  );
}
