"use client";

import { useEffect, useRef } from "react";
import { isStandalone } from "@/lib/pwa/is-standalone";

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

interface FullscreenManagerProps {
  fullscreenMode: boolean;
}

export function FullscreenManager({ fullscreenMode }: FullscreenManagerProps) {
  const activatedRef = useRef(false);

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

    // Android: 첫 터치 시 requestFullscreen 호출 (보안 정책상 gesture 필요)
    if (!document.fullscreenEnabled) return;

    async function enterFullscreen() {
      if (activatedRef.current) return;
      activatedRef.current = true;
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // 실패 시 조용히 무시 (일부 브라우저 제한)
      }
    }

    document.addEventListener("click", enterFullscreen, { once: true });
    document.addEventListener("touchstart", enterFullscreen, { once: true });

    return () => {
      document.removeEventListener("click", enterFullscreen);
      document.removeEventListener("touchstart", enterFullscreen);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [fullscreenMode]);

  return null;
}
