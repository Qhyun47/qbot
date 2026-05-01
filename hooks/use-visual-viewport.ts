"use client";

import { useEffect, useState } from "react";

interface VisualViewportState {
  height: number;
  offsetTop: number;
}

function getSnapshot(): VisualViewportState {
  const vv = window.visualViewport;
  if (vv) {
    return { height: vv.height, offsetTop: vv.offsetTop };
  }
  return { height: window.innerHeight, offsetTop: 0 };
}

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    if (typeof window === "undefined") return { height: 0, offsetTop: 0 };
    return getSnapshot();
  });

  useEffect(() => {
    const update = () => setState(getSnapshot());
    const vv = window.visualViewport;

    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    } else {
      window.addEventListener("resize", update);
    }

    update();

    return () => {
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      } else {
        window.removeEventListener("resize", update);
      }
    };
  }, []);

  return state;
}
