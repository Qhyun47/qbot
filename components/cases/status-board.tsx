import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBoardCard } from "@/components/cases/status-board-card";
import type { Case, BedZone } from "@/lib/supabase/types";

const ZONE_LABELS: Record<BedZone, string> = {
  A: "A구역",
  B: "B구역",
  R: "R구역",
};

const ZONE_ORDER: BedZone[] = ["A", "B", "R"];

interface StatusBoardProps {
  cases: Case[];
}

export function StatusBoard({ cases }: StatusBoardProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          현재 응급실에 환자가 없습니다.
        </p>
        <Button asChild size="sm">
          <Link href="/cases/new">환자 추가하기</Link>
        </Button>
      </div>
    );
  }

  const grouped = ZONE_ORDER.reduce<Record<BedZone, Case[]>>(
    (acc, zone) => {
      acc[zone] = cases.filter((c) => c.bed_zone === zone);
      return acc;
    },
    { A: [], B: [], R: [] }
  );

  return (
    <div className="flex flex-col gap-6">
      {ZONE_ORDER.filter((zone) => grouped[zone].length > 0).map((zone) => (
        <div key={zone} className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {ZONE_LABELS[zone]}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {grouped[zone].map((c) => (
              <StatusBoardCard key={c.id} case={c} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
