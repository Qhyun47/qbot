import Link from "next/link";
import { format } from "date-fns";
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
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
        <p className="flex-1 text-sm font-medium leading-snug">
          {c.cc ?? (
            <span className="italic text-muted-foreground">C.C 미입력</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(c.created_at), "M월 d일 HH:mm")}
        </p>
      </div>
    </Link>
  );
}
