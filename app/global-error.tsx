"use client";

import { useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSendLog() {
    setSending(true);
    try {
      await fetch("/api/error-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageUrl: window.location.href,
          errorMessage: error.message || "알 수 없는 오류",
          stackTrace: error.stack,
        }),
      });
    } catch {
      // 무시
    }
    setSent(true);
    setSending(false);
  }

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#fafafa",
          color: "#18181b",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "24px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            ⚠️
          </div>

          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
              잠시 문제가 발생했습니다
            </h1>
            <p style={{ fontSize: 14, color: "#71717a", margin: 0 }}>
              페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#18181b",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>

            <button
              onClick={handleSendLog}
              disabled={sent || sending}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                backgroundColor: sent ? "#f0fdf4" : "#fff",
                color: sent ? "#16a34a" : "#18181b",
                fontSize: 14,
                cursor: sent || sending ? "default" : "pointer",
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sent ? "✓ 전송됨" : sending ? "전송 중..." : "에러 로그 보내기"}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
