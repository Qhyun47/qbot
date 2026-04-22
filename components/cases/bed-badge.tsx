import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { BedZone } from "@/lib/supabase/types";

const bedBadgeVariants = cva(
  "inline-flex items-center font-mono font-semibold tracking-wide",
  {
    variants: {
      size: {
        sm: "rounded px-1.5 py-0.5 text-xs",
        md: "rounded px-2 py-0.5 text-sm",
        lg: "rounded-md px-2.5 py-1 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface BedBadgeProps extends VariantProps<typeof bedBadgeVariants> {
  bedZone: BedZone;
  bedNumber: number | null;
  className?: string;
}

export function BedBadge({
  bedZone,
  bedNumber,
  size,
  className,
}: BedBadgeProps) {
  if (bedNumber === null) return null;
  return (
    <span
      className={cn(
        bedBadgeVariants({ size }),
        "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
        className
      )}
    >
      {bedZone}
      {String(bedNumber).padStart(2, "0")}
    </span>
  );
}
