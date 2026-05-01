import Link from "next/link";
import { format } from "date-fns";
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Case, BedZone, CaseStatus } from "@/lib/supabase/types";

interface CaseCardProps {
  case: Case;
}

export function CaseCard({ case: c }: CaseCardProps) {
  return (
    <Link href={`/cases/${c.id}?from=dashboard`}>
      <div className="shadow-xs group flex h-full cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <BedBadge
            bedZone={c.bed_zone as BedZone}
            bedNumber={c.bed_number}
            bedExplicitlySet={c.bed_explicitly_set}
            size="sm"
          />
          <StatusBadge status={c.status as CaseStatus} />
        </div>
        <div className="flex min-w-0 flex-1 items-start gap-1">
          <p className="truncate text-sm font-medium leading-snug">
            {c.ccs?.[0] ?? c.cc ?? (
              <span className="italic text-muted-foreground">C.C 미입력</span>
            )}
          </p>
          {(c.ccs?.length ?? 0) > 1 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="mt-0.5 shrink-0 cursor-default rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    +{c.ccs!.length - 1}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{c.ccs!.slice(1).join(", ")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {format(new Date(c.created_at), "M월 d일 HH:mm")}
        </p>
      </div>
    </Link>
  );
}
