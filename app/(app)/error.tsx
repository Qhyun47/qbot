"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitErrorLog } from "@/lib/errors/actions";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // 개발 환경에서만 콘솔에 출력
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[AppError]", error);
    }
  }, [error]);

  async function handleSendLog() {
    setSending(true);
    await submitErrorLog({
      pageUrl: window.location.href,
      errorMessage: error.message || "알 수 없는 오류",
      stackTrace: error.stack,
    });
    setSent(true);
    setSending(false);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold">잠시 문제가 발생했습니다</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
          <br />
          문제가 반복된다면 에러 로그를 보내주시면 확인하겠습니다.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCw className="size-4" />
          다시 시도
        </Button>

        {sent ? (
          <Button variant="outline" disabled className="gap-2">
            <CheckCircle className="size-4 text-green-600" />
            전송됨
          </Button>
        ) : (
          <Button
            onClick={handleSendLog}
            variant="outline"
            disabled={sending}
            className="gap-2"
          >
            <Send className="size-4" />
            {sending ? "전송 중..." : "에러 로그 보내기"}
          </Button>
        )}
      </div>
    </div>
  );
}
