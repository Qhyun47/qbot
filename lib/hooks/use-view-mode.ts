"use client";

import { useSyncExternalStore, useCallback } from "react";

export type ViewMode = "auto" | "mobile" | "desktop";

const LS_KEY = "er-view-mode";
const EVENT = "er-view-mode-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

function getSnapshot(): ViewMode {
  const v = localStorage.getItem(LS_KEY);
  return v === "mobile" || v === "desktop" ? v : "auto";
}

function getServerSnapshot(): ViewMode {
  return "auto";
}

const COOKIE_KEY = "x-device-type";

function applyToHtml(mode: ViewMode) {
  const html = document.documentElement;
  if (mode === "mobile") {
    html.removeAttribute("data-view");
  } else if (mode === "desktop") {
    html.setAttribute("data-view", "desktop");
  } else {
    // auto: 쿠키 → pointer:fine fallback 순으로 복원
    const cookieVal = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith(COOKIE_KEY + "="))
      ?.split("=")[1]
      ?.trim();
    if (cookieVal === "desktop") {
      html.setAttribute("data-view", "desktop");
    } else if (
      !cookieVal &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      html.setAttribute("data-view", "desktop");
    } else {
      html.removeAttribute("data-view");
    }
  }
}

function setCookie(value: string, maxAge: number) {
  document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function useViewMode() {
  const viewMode = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setViewMode = useCallback((mode: ViewMode) => {
    if (mode === "auto") {
      localStorage.removeItem(LS_KEY);
      // 쿠키 삭제 → 다음 미들웨어 실행 시 UA 재감지
      setCookie("", 0);
    } else {
      localStorage.setItem(LS_KEY, mode);
      setCookie(mode, 31536000);
    }
    applyToHtml(mode);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { viewMode, setViewMode };
}
