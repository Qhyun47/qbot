"use client";

import { useEffect } from "react";
import { isStandalone } from "@/lib/pwa/is-standalone";

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isMobileDevice(): boolean {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

interface FullscreenManagerProps {
  fullscreenMode: boolean;
}

export function FullscreenManager({ fullscreenMode }: FullscreenManagerProps) {
  useEffect(() => {
    if (!fullscreenMode || !isStandalone() || !isMobileDevice()) return;

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

    // 뒤로가기 버튼이 전체화면을 해제하면 popstate가 함께 발생함.
    // fullscreenchange에서 즉시 재진입하면 뒤로가기 네비게이션을 막으므로,
    // 다음 사용자 제스처(터치/클릭)에서만 재진입한다.
    function handleInteraction() {
      if (!document.fullscreenElement) {
        tryEnterFullscreen();
      }
    }

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [fullscreenMode]);

  return null;
}
