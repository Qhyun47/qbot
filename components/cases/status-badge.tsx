import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/lib/supabase/types";
import type { BadgeProps } from "@/components/ui/badge";

type StatusConfig = {
  variant: BadgeProps["variant"];
  label: string;
  Icon: LucideIcon;
  iconClassName?: string;
};

const STATUS_CONFIG: Record<CaseStatus, StatusConfig> = {
  draft: { variant: "outline", label: "초안", Icon: Clock },
  generating: {
    variant: "secondary",
    label: "생성 중",
    Icon: Loader2,
    iconClassName: "animate-spin",
  },
  completed: { variant: "default", label: "완료", Icon: CheckCircle2 },
  failed: { variant: "destructive", label: "실패", Icon: XCircle },
};

interface StatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { variant, label, Icon, iconClassName } = STATUS_CONFIG[status];
  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className={cn("size-3", iconClassName)} />
      {label}
    </Badge>
  );
}
