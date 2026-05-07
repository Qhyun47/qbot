"use client";

interface StepIndicatorProps {
  total: number;
  current: number;
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`size-2 rounded-full transition-all duration-300 ${
            i === current
              ? "scale-125 bg-primary"
              : "border border-primary/50 bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}
