import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/lib/supabase/types";

type StatusConfig = {
  label: string;
  Icon: LucideIcon;
  iconClassName?: string;
  className: string;
};

const STATUS_CONFIG: Record<CaseStatus, StatusConfig> = {
  draft: {
    label: "초안",
    Icon: Clock,
    className:
      "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  },
  generating: {
    label: "생성 중",
    Icon: Loader2,
    iconClassName: "animate-spin",
    className:
      "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  },
  completed: {
    label: "완료",
    Icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  },
  failed: {
    label: "실패",
    Icon: XCircle,
    className:
      "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  },
};

interface StatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const {
    label,
    Icon,
    iconClassName,
    className: statusClassName,
  } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex min-w-[3.5rem] items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        statusClassName,
        className
      )}
    >
      <Icon className={cn("size-3", iconClassName)} />
      {label}
    </span>
  );
}
