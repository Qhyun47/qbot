"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface CoachMarkProps {
  children: ReactNode;
  tooltip: ReactNode;
  tooltipPosition?: TooltipPosition;
  active?: boolean;
  wrapperClassName?: string;
}

interface PortalStyle {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const transformClass: Record<TooltipPosition, string> = {
  top: "-translate-x-1/2",
  bottom: "-translate-x-1/2",
  left: "-translate-y-1/2",
  right: "-translate-y-1/2",
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white",
  left: "left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white",
  right:
    "right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white",
};

export function CoachMark({
  children,
  tooltip,
  tooltipPosition = "bottom",
  active = false,
  wrapperClassName,
}: CoachMarkProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [portalStyle, setPortalStyle] = useState<PortalStyle>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active || !wrapperRef.current) return;

    const update = () => {
      if (!wrapperRef.current) return;
      const r = wrapperRef.current.getBoundingClientRect();
      const midX = r.left + r.width / 2;
      const midY = r.top + r.height / 2;

      switch (tooltipPosition) {
        case "bottom":
          setPortalStyle({ top: r.bottom + 12, left: midX });
          break;
        case "top":
          setPortalStyle({
            bottom: window.innerHeight - r.top + 12,
            left: midX,
          });
          break;
        case "left":
          setPortalStyle({ top: midY, right: window.innerWidth - r.left + 12 });
          break;
        case "right":
          setPortalStyle({ top: midY, left: r.right + 12 });
          break;
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [active, tooltipPosition]);

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
          className={
            active ? "animate-pulse rounded-lg ring-2 ring-primary" : undefined
          }
        >
          {children}
        </div>
      </div>
      {active &&
        mounted &&
        createPortal(
          <div
            style={{ position: "fixed", zIndex: 50, ...portalStyle }}
            className={`w-max max-w-xs ${transformClass[tooltipPosition]}`}
          >
            <div className="relative rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-lg">
              {tooltip}
              <span
                className={`absolute h-0 w-0 ${arrowClasses[tooltipPosition]}`}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
