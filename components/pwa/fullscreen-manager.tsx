"use client";

import { useEffect } from "react";
import { isStandalone } from "@/lib/pwa/is-standalone";

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

interface FullscreenManagerProps {
  fullscreenMode: boolean;
}

export function FullscreenManager({ fullscreenMode }: FullscreenManagerProps) {
  useEffect(() => {
    if (!fullscreenMode || !isStandalone()) return;

    // iOS: apple-mobile-web-app-status-bar-style 메타태그 동적 전환
    if (isIosDevice()) {
      const meta = document.querySelector(
        'meta[name="apple-mobile-web-app-status-bar-style"]'
      );
      if (meta) {
        meta.setAttribute("content", "black-translucent");
      }
      return () => {
        if (meta) meta.setAttribute("content", "default");
      };
    }

    // Android: Fullscreen API
    if (!document.fullscreenEnabled) return;

    let pendingRequest = false;

    async function tryEnterFullscreen() {
      if (document.fullscreenElement || pendingRequest) return;
      pendingRequest = true;
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // 실패 시 무시 (gesture 컨텍스트 없을 때)
      } finally {
        pendingRequest = false;
      }
    }

    // 뒤로가기 등으로 fullscreen이 종료되면 즉시 재진입 시도
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        tryEnterFullscreen();
      }
    }

    // fullscreenchange 내 재진입이 브라우저에서 막힐 경우 다음 제스처에서 재진입
    function handleInteraction() {
      if (!document.fullscreenElement) {
        tryEnterFullscreen();
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [fullscreenMode]);

  return null;
}
