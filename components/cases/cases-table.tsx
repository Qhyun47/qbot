"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
import type { Case, BedZone, CaseStatus } from "@/lib/supabase/types";

interface CasesTableProps {
  cases: Case[];
}

export function CasesTable({ cases }: CasesTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleRowClick(id: string) {
    router.push(`/cases/${id}`);
  }

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDeletingId(id);
  }

  function handleDeleteConfirm() {
    setDeletingId(null);
    toast.success("케이스가 삭제되었습니다.");
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">케이스가 없습니다.</p>
      </div>
    );
  }

  return (
    <>
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
              {cases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => handleRowClick(c.id)}
                  className="cursor-pointer bg-card transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3.5">
                    <BedBadge
                      bedZone={c.bed_zone as BedZone}
                      bedNumber={c.bed_number}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {format(parseISO(c.created_at), "M/d HH:mm")}
                  </td>
                  <td className="px-4 py-3.5 font-medium">
                    {c.cc ?? <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={c.status as CaseStatus} />
                  </td>
                  <td className="px-4 py-3.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, c.id)}
                      aria-label="케이스 삭제"
                      className="size-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>케이스를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 케이스와 관련된 모든 입력 카드 및
              결과가 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
