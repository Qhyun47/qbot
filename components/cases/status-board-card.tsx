"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { hideFromBoard, updateCaseMemo } from "@/lib/cases/actions";
import { BedBadge } from "@/components/cases/bed-badge";
import { StatusBadge } from "@/components/cases/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import type { Case, BedZone, CaseStatus } from "@/lib/supabase/types";

interface StatusBoardCardProps {
  case: Case;
}

export function StatusBoardCard({ case: c }: StatusBoardCardProps) {
  const router = useRouter();
  const [memo, setMemo] = useState(c.memo ?? "");
  const [debouncedMemo] = useDebounce(memo, 500);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const savedRef = useRef(c.memo ?? "");

  useEffect(() => {
    if (debouncedMemo === savedRef.current) return;
    updateCaseMemo(c.id, debouncedMemo)
      .then(() => {
        savedRef.current = debouncedMemo;
      })
      .catch(() => toast.error("메모 저장에 실패했습니다."));
  }, [debouncedMemo, c.id]);

  function handleMemoBlur() {
    if (memo === savedRef.current) return;
    updateCaseMemo(c.id, memo)
      .then(() => {
        savedRef.current = memo;
      })
      .catch(() => toast.error("메모 저장에 실패했습니다."));
  }

  async function handleDeleteConfirm() {
    await hideFromBoard(c.id);
    toast.success(
      "현황판에서 제거했습니다. 케이스 목록에서 다시 추가할 수 있습니다."
    );
  }

  return (
    <>
      <div
        onClick={() => router.push(`/cases/${c.id}`)}
        className="flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
      >
        {/* 상단: 베드번호 + 상태 */}
        <div className="flex items-center justify-between">
          <BedBadge
            bedZone={c.bed_zone as BedZone}
            bedNumber={c.bed_number}
            bedExplicitlySet={c.bed_explicitly_set}
            size="sm"
          />
          <StatusBadge status={c.status as CaseStatus} />
        </div>

        {/* C.C */}
        <p className="text-sm font-medium leading-snug">
          {c.cc ?? (
            <span className="italic text-muted-foreground">C.C 미입력</span>
          )}
        </p>

        {/* 메모 입력 */}
        <Textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={handleMemoBlur}
          placeholder="메모..."
          rows={2}
          className="resize-none text-xs text-muted-foreground placeholder:text-muted-foreground/50"
        />

        {/* 하단: 삭제 버튼 */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
            aria-label="케이스 삭제"
            className="size-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>현황판에서 제거하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              케이스는 삭제되지 않으며 케이스 목록에서 다시 현황판에 추가할 수
              있습니다.
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
