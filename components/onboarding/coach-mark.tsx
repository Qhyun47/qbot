"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface CoachMarkProps {
  children: ReactNode;
  tooltip: ReactNode;
  tooltipPosition?: TooltipPosition;
  active?: boolean;
  wrapperClassName?: string;
}

interface TooltipStyle {
  top?: number;
  left?: number;
}

export function CoachMark({
  children,
  tooltip,
  tooltipPosition = "bottom",
  active = false,
  wrapperClassName,
}: CoachMarkProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<TooltipStyle>({ top: -9999, left: -9999 });
  const [arrowX, setArrowX] = useState<number | null>(null);
  const [arrowY, setArrowY] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const recalculate = useCallback(() => {
    const wrapper = wrapperRef.current;
    const tip = tooltipRef.current;
    if (!wrapper || !tip) return;

    const r = wrapper.getBoundingClientRect();
    const tW = tip.offsetWidth;
    const tH = tip.offsetHeight;
    const SAFE = 8;

    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    switch (tooltipPosition) {
      case "bottom": {
        const rawLeft = cx - tW / 2;
        const left = Math.max(
          SAFE,
          Math.min(window.innerWidth - tW - SAFE, rawLeft)
        );
        setStyle({ top: r.bottom + 12, left });
        setArrowX(cx - left);
        break;
      }
      case "top": {
        const rawLeft = cx - tW / 2;
        const left = Math.max(
          SAFE,
          Math.min(window.innerWidth - tW - SAFE, rawLeft)
        );
        setStyle({ top: r.top - tH - 12, left });
        setArrowX(cx - left);
        break;
      }
      case "left": {
        const rawTop = cy - tH / 2;
        const top = Math.max(
          SAFE,
          Math.min(window.innerHeight - tH - SAFE, rawTop)
        );
        setStyle({ top, left: r.left - tW - 12 });
        setArrowY(cy - top);
        break;
      }
      case "right": {
        const rawTop = cy - tH / 2;
        const top = Math.max(
          SAFE,
          Math.min(window.innerHeight - tH - SAFE, rawTop)
        );
        setStyle({ top, left: r.right + 12 });
        setArrowY(cy - top);
        break;
      }
    }
  }, [tooltipPosition]);

  useEffect(() => {
    if (!active) return;
    setStyle({ top: -9999, left: -9999 });
    setArrowX(null);
    setArrowY(null);
    const raf = requestAnimationFrame(recalculate);
    window.addEventListener("resize", recalculate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recalculate);
    };
  }, [active, tooltip, recalculate]);

  const arrowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
    };
    switch (tooltipPosition) {
      case "bottom":
        return {
          ...base,
          top: -8,
          left: arrowX ?? "50%",
          transform: "translateX(-50%)",
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: "8px solid white",
        };
      case "top":
        return {
          ...base,
          bottom: -8,
          left: arrowX ?? "50%",
          transform: "translateX(-50%)",
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid white",
        };
      case "left":
        return {
          ...base,
          right: -8,
          top: arrowY ?? "50%",
          transform: "translateY(-50%)",
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderLeft: "8px solid white",
        };
      case "right":
        return {
          ...base,
          left: -8,
          top: arrowY ?? "50%",
          transform: "translateY(-50%)",
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          borderRight: "8px solid white",
        };
    }
  };

  return (
    <>
      {active &&
        mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-40 bg-black/50" />,
          document.body
        )}
      <div
        ref={wrapperRef}
        className={`relative ${wrapperClassName ?? "inline-block"} ${active ? "z-50" : ""}`}
      >
        <div
          className={cn(
            "w-full",
            active && "animate-pulse rounded-lg ring-2 ring-primary"
          )}
        >
          {children}
        </div>
      </div>
      {active &&
        mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: "fixed",
              zIndex: 50,
              top: style.top,
              left: style.left,
            }}
            className="w-max max-w-[280px]"
          >
            <div className="relative rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-lg">
              {tooltip}
              <span style={arrowStyle()} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
