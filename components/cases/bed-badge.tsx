import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { BedZone } from "@/lib/supabase/types";

const bedBadgeVariants = cva(
  "inline-flex items-center border font-medium transition-colors",
  {
    variants: {
      size: {
        sm: "rounded px-1.5 py-0.5 text-xs",
        md: "rounded-md px-2.5 py-0.5 text-sm",
        lg: "rounded-md px-3 py-1 text-base font-semibold",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface BedBadgeProps extends VariantProps<typeof bedBadgeVariants> {
  bedZone: BedZone;
  bedNumber: number;
  className?: string;
}

export function BedBadge({
  bedZone,
  bedNumber,
  size,
  className,
}: BedBadgeProps) {
  return (
    <span
      className={cn(
        bedBadgeVariants({ size }),
        "bg-primary text-primary-foreground",
        className
      )}
    >
      {bedZone}-{bedNumber}
    </span>
  );
}
