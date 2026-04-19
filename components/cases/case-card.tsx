import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
import type { Case, BedZone, CaseStatus } from "@/lib/supabase/types";

interface CaseCardProps {
  case: Case;
}

export function CaseCard({ case: c }: CaseCardProps) {
  return (
    <Link href={`/cases/${c.id}`}>
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <BedBadge
              bedZone={c.bed_zone as BedZone}
              bedNumber={c.bed_number}
              size="sm"
            />
            <StatusBadge status={c.status as CaseStatus} />
          </div>
          <p className="font-medium">{c.cc ?? "(C.C 미입력)"}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(c.created_at), "MM/dd HH:mm")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
