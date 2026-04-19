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
import type { Case } from "@/lib/supabase/types";

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

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-3 pr-4 font-medium">베드번호</th>
              <th className="py-3 pr-4 font-medium">날짜</th>
              <th className="py-3 pr-4 font-medium">C.C</th>
              <th className="py-3 pr-4 font-medium">상태</th>
              <th className="py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr
                key={c.id}
                onClick={() => handleRowClick(c.id)}
                className="cursor-pointer border-b transition-colors hover:bg-muted/50"
              >
                <td className="py-3 pr-4">
                  <BedBadge
                    bedZone={c.bed_zone as "A" | "B" | "R"}
                    bedNumber={c.bed_number}
                    size="sm"
                  />
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {format(parseISO(c.created_at), "M/d HH:mm")}
                </td>
                <td className="py-3 pr-4">{c.cc ?? "-"}</td>
                <td className="py-3 pr-4">
                  <StatusBadge
                    status={
                      c.status as
                        | "draft"
                        | "generating"
                        | "completed"
                        | "failed"
                    }
                  />
                </td>
                <td className="py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteClick(e, c.id)}
                    aria-label="케이스 삭제"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cases.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            케이스가 없습니다.
          </p>
        )}
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
