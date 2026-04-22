"use client";

import { useEffect } from "react";

interface FontSizeInitProps {
  fontSize: number;
}

export function FontSizeInit({ fontSize }: FontSizeInitProps) {
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--mobile-font-size",
      `${fontSize}px`
    );
  }, [fontSize]);

  return null;
}
