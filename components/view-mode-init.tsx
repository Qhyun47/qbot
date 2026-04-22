"use client";

import { useEffect } from "react";

const LS_KEY = "er-view-mode";

export function ViewModeInit() {
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "mobile" || saved === "desktop") {
      document.documentElement.setAttribute("data-view", saved);
    }
  }, []);

  return null;
}
