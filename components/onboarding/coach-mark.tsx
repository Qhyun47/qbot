"use client";

import { ReactNode } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface CoachMarkProps {
  children: ReactNode;
  tooltip: ReactNode;
  tooltipPosition?: TooltipPosition;
  active?: boolean;
}

const arrowStyles: Record<TooltipPosition, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white",
  left: "left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white",
  right:
    "right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white",
};

const tooltipPositionStyles: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
  left: "right-full top-1/2 -translate-y-1/2 mr-3",
  right: "left-full top-1/2 -translate-y-1/2 ml-3",
};

export function CoachMark({
  children,
  tooltip,
  tooltipPosition = "bottom",
  active = false,
}: CoachMarkProps) {
  return (
    <>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-40 bg-black/50" />
      )}
      <div className={`relative inline-block ${active ? "z-50" : ""}`}>
        <div
          className={
            active ? "animate-pulse rounded-lg ring-2 ring-primary" : undefined
          }
        >
          {children}
        </div>
        {active && (
          <div
            className={`absolute ${tooltipPositionStyles[tooltipPosition]} z-50 w-max max-w-xs`}
          >
            <div className="relative rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-lg">
              {tooltip}
              <span
                className={`absolute h-0 w-0 ${arrowStyles[tooltipPosition]}`}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
