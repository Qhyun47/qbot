"use client";

import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { restoreToBoard } from "@/lib/cases/actions";
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
import { Button } from "@/components/ui/button";
import type { Case, BedZone, CaseStatus } from "@/lib/supabase/types";

interface CasesTableProps {
  cases: Case[];
}

export function CasesTable({ cases }: CasesTableProps) {
  const router = useRouter();

  function handleRowClick(id: string) {
    router.push(`/cases/${id}?from=cases`);
  }

  async function handleRestore(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await restoreToBoard(id);
    toast.success("현황판에 재등록했습니다.");
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">
          최근 24시간 이내 케이스가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 모바일 카드 리스트 */}
      <div className="is-desktop:hidden">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {cases.map((c, idx) => {
            const isHidden = c.board_hidden_at !== null;
            return (
              <div
                key={c.id}
                onClick={() => handleRowClick(c.id)}
                className={[
                  "relative flex cursor-pointer items-center gap-3 px-4 py-3.5",
                  "transition-colors active:bg-muted/60",
                  idx !== 0 ? "border-t" : "",
                  isHidden
                    ? "bg-card"
                    : "border-l-[3px] border-l-blue-500 bg-blue-50/60 dark:bg-blue-950/20",
                ].join(" ")}
              >
                {/* 베드번호 배지 */}
                <div className="shrink-0">
                  <BedBadge
                    bedZone={c.bed_zone as BedZone}
                    bedNumber={c.bed_number}
                    bedExplicitlySet={c.bed_explicitly_set}
                    size="md"
                  />
                </div>

                {/* C.C + 날짜 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {c.cc ?? (
                      <span className="font-normal text-muted-foreground">
                        C.C 없음
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(parseISO(c.created_at), "M/d HH:mm")}
                  </p>
                </div>

                {/* 상태 배지 + 재등록 버튼 */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={c.status as CaseStatus} />
                  {isHidden && (
                    <button
                      onClick={(e) => handleRestore(e, c.id)}
                      className="flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground active:text-foreground"
                    >
                      <PlusCircle className="size-3.5" />
                      재등록
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 데스크탑 테이블 */}
      <div className="hidden is-desktop:block">
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    베드번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    날짜
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    C.C
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    상태
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cases.map((c) => {
                  const isHidden = c.board_hidden_at !== null;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c.id)}
                      className={`cursor-pointer transition-colors hover:bg-muted/30 ${isHidden ? "bg-card" : "bg-blue-50 dark:bg-blue-950/20"}`}
                    >
                      <td className="h-14 px-4">
                        <BedBadge
                          bedZone={c.bed_zone as BedZone}
                          bedNumber={c.bed_number}
                          bedExplicitlySet={c.bed_explicitly_set}
                          size="sm"
                        />
                      </td>
                      <td className="h-14 px-4 text-muted-foreground">
                        {format(parseISO(c.created_at), "M/d HH:mm")}
                      </td>
                      <td className="h-14 px-4 font-medium">
                        {c.cc ?? (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="h-14 px-4">
                        <StatusBadge status={c.status as CaseStatus} />
                      </td>
                      <td className="h-14 px-4">
                        {isHidden && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleRestore(e, c.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <PlusCircle className="size-3.5" />
                            현황판 재등록
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
