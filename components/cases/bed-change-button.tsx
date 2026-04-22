"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { BedBadge } from "@/components/cases/bed-badge";
import { BedPicker } from "@/components/cases/bed-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateCaseBed } from "@/lib/cases/actions";
import type { BedZone } from "@/lib/supabase/types";

interface BedChangeButtonProps {
  caseId: string;
  bedZone: BedZone;
  bedNumber: number;
  size?: "sm" | "md" | "lg";
}

export function BedChangeButton({
  caseId,
  bedZone,
  bedNumber,
  size = "lg",
}: BedChangeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [zone, setZone] = useState<BedZone>(bedZone);
  const [num, setNum] = useState<number | null>(bedNumber);
  const [saving, setSaving] = useState(false);

  function handleChange(z: BedZone, n: number | null) {
    setZone(z);
    setNum(n);
  }

  async function handleSave() {
    if (num === null) return;
    setSaving(true);
    try {
      await updateCaseBed(caseId, zone, num);
      toast.success(
        `베드번호가 ${zone}${String(num).padStart(2, "0")}으로 변경되었습니다.`
      );
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("베드번호 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpen() {
    // 다이얼로그 열 때 현재 값으로 초기화
    setZone(bedZone);
    setNum(bedNumber);
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="group relative inline-flex items-center gap-1"
        aria-label="베드번호 변경"
      >
        <BedBadge bedZone={bedZone} bedNumber={bedNumber} size={size} />
        <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>베드번호 변경</DialogTitle>
          </DialogHeader>
          <BedPicker bedZone={zone} bedNumber={num} onChange={handleChange} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={num === null || saving}>
              {saving ? "저장 중..." : "변경"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
