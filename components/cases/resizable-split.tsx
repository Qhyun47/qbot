"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_PERCENT = 30;
const SNAP_PERCENT = 50;
const SNAP_THRESHOLD = 2;

interface ResizableSplitProps {
  first: React.ReactNode;
  second: React.ReactNode;
  direction: "horizontal" | "vertical";
  defaultFirstPercent?: number;
}

export function ResizableSplit({
  first,
  second,
  direction,
  defaultFirstPercent = 60,
}: ResizableSplitProps) {
  const [firstPercent, setFirstPercent] = useState(defaultFirstPercent);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // 첫 번째 패널의 픽셀 크기를 기억 — 키보드 등으로 컨테이너가 줄어도 유지
  const firstPxRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      if (firstPxRef.current === null) return;
      const rect = container.getBoundingClientRect();
      const total = direction === "horizontal" ? rect.width : rect.height;
      if (total <= 0) return;
      const minPx = (total * MIN_PERCENT) / 100;
      const maxPx = (total * (100 - MIN_PERCENT)) / 100;
      const clamped = Math.max(minPx, Math.min(maxPx, firstPxRef.current));
      setFirstPercent((clamped / total) * 100);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [direction]);

  const startDrag = useCallback(
    (startClientPos: number) => {
      setDragging(true);

      const onMove = (clientPos: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const total = direction === "horizontal" ? rect.width : rect.height;
        const offset =
          direction === "horizontal"
            ? clientPos - rect.left
            : clientPos - rect.top;

        let pct = (offset / total) * 100;
        pct = Math.max(MIN_PERCENT, Math.min(100 - MIN_PERCENT, pct));
        if (Math.abs(pct - SNAP_PERCENT) <= SNAP_THRESHOLD) pct = SNAP_PERCENT;
        firstPxRef.current = (pct / 100) * total;
        setFirstPercent(pct);
      };

      const onMouseMove = (e: MouseEvent) =>
        onMove(direction === "horizontal" ? e.clientX : e.clientY);
      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        onMove(
          direction === "horizontal"
            ? e.touches[0].clientX
            : e.touches[0].clientY
        );
      };
      const onEnd = () => {
        setDragging(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onEnd);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onEnd);

      // suppress unused warning
      void startClientPos;
    },
    [direction]
  );

  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-1 select-none overflow-hidden",
        isHorizontal ? "flex-row" : "flex-col"
      )}
    >
      {/* 첫 번째 패널 */}
      <div
        style={
          isHorizontal
            ? { width: `${firstPercent}%` }
            : { height: `${firstPercent}%` }
        }
        className="overflow-hidden"
      >
        {first}
      </div>

      {/* 드래그 핸들 */}
      <div
        className={cn(
          "group relative z-10 flex shrink-0 items-center justify-center",
          isHorizontal ? "w-5 cursor-col-resize" : "h-5 cursor-row-resize"
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag(isHorizontal ? e.clientX : e.clientY);
        }}
        onTouchStart={(e) => {
          startDrag(isHorizontal ? e.touches[0].clientX : e.touches[0].clientY);
        }}
      >
        {/* 구분선 — 2px, 명확하게 표시 */}
        <div
          className={cn(
            "absolute transition-colors",
            isHorizontal
              ? "inset-y-0 left-1/2 w-0.5 -translate-x-1/2"
              : "inset-x-0 top-1/2 h-0.5 -translate-y-1/2",
            dragging
              ? "bg-primary/60"
              : "bg-neutral-300 group-hover:bg-neutral-400 dark:bg-neutral-600 dark:group-hover:bg-neutral-500"
          )}
        />
        {/* 그립 핸들 — 선 위에 float */}
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full bg-white shadow-md ring-1 transition-all dark:bg-neutral-800",
            dragging
              ? "shadow-primary/20 ring-primary/50"
              : "ring-neutral-200 group-hover:ring-neutral-300 dark:ring-neutral-700",
            isHorizontal ? "h-8 w-3" : "h-3 w-8"
          )}
        >
          {isHorizontal ? (
            <GripVertical className="size-2.5 text-neutral-400 dark:text-neutral-500" />
          ) : (
            <GripHorizontal className="size-2.5 text-neutral-400 dark:text-neutral-500" />
          )}
        </div>
      </div>

      {/* 두 번째 패널 */}
      <div className="flex-1 overflow-hidden">{second}</div>
    </div>
  );
}
