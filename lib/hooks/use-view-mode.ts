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

function applyToHtml(mode: ViewMode) {
  const html = document.documentElement;
  if (mode === "auto") {
    html.removeAttribute("data-view");
  } else {
    html.setAttribute("data-view", mode);
  }
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
    } else {
      localStorage.setItem(LS_KEY, mode);
    }
    applyToHtml(mode);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { viewMode, setViewMode };
}
