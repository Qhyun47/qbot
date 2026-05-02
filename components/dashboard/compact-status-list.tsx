"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Minus,
  Bell,
  BellRing,
  BellOff,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { updateCaseMemo, updateNotifyStatus } from "@/lib/cases/actions";
import { BedBadge } from "@/components/cases/bed-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Case, BedZone, CaseStatus } from "@/lib/supabase/types";

type NotifyStatus = "완료" | "예정" | "불필요" | null;

const ZONE_LABELS: Record<BedZone, string> = {
  A: "A구역",
  B: "B구역",
  R: "R구역",
};
const ZONE_ORDER: BedZone[] = ["A", "B", "R"];

const NOTIFY_OPTIONS: { value: NotifyStatus; label: string }[] = [
  { value: null, label: "— 미확인" },
  { value: "예정", label: "예정" },
  { value: "완료", label: "완료" },
  { value: "불필요", label: "불필요" },
];

function StatusIcon({ status }: { status: CaseStatus }) {
  switch (status) {
    case "draft":
      return <Clock className="size-3.5 shrink-0 text-zinc-500" />;
    case "generating":
      return (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-blue-500" />
      );
    case "completed":
      return <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />;
    case "failed":
      return <XCircle className="size-3.5 shrink-0 text-red-500" />;
  }
}

function NotifyIcon({ status }: { status: NotifyStatus }) {
  switch (status) {
    case "예정":
      return <Bell className="size-3.5 shrink-0 text-amber-500" />;
    case "완료":
      return <BellRing className="size-3.5 shrink-0 text-emerald-500" />;
    case "불필요":
      return <BellOff className="size-3.5 shrink-0 text-muted-foreground" />;
    default:
      return <Minus className="size-3.5 shrink-0 text-muted-foreground/40" />;
  }
}

function NotifyCell({
  caseId,
  initial,
}: {
  caseId: string;
  initial: NotifyStatus;
}) {
  const [status, setStatus] = useState<NotifyStatus>(initial);

  function handleChange(value: NotifyStatus) {
    const prev = status;
    setStatus(value);
    updateNotifyStatus(caseId, value).catch(() => {
      setStatus(prev);
      toast.error("노티 상태 저장에 실패했습니다.");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded p-0.5 hover:bg-muted"
          aria-label="노티 상태 변경"
        >
          <NotifyIcon status={status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {NOTIFY_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={String(opt.value)}
            onSelect={() => handleChange(opt.value)}
            className="flex items-center gap-2"
          >
            <NotifyIcon status={opt.value} />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MemoCell({ caseId, initial }: { caseId: string; initial: string }) {
  const [displayMemo, setDisplayMemo] = useState(initial);
  const [editValue, setEditValue] = useState(initial);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [debouncedEdit] = useDebounce(editValue, 500);
  const savedRef = useRef(initial);

  useEffect(() => {
    if (!popoverOpen) return;
    if (debouncedEdit === savedRef.current) return;
    updateCaseMemo(caseId, debouncedEdit)
      .then(() => {
        savedRef.current = debouncedEdit;
        setDisplayMemo(debouncedEdit);
      })
      .catch(() => toast.error("메모 저장에 실패했습니다."));
  }, [debouncedEdit, caseId, popoverOpen]);

  function handlePopoverChange(open: boolean) {
    setPopoverOpen(open);
    if (open) {
      setEditValue(displayMemo);
    } else if (editValue !== savedRef.current) {
      // savedRef를 먼저 갱신해서 useEffect의 디바운스 저장이 중복 실행되지 않도록 방지
      const valueToSave = editValue;
      savedRef.current = valueToSave;
      updateCaseMemo(caseId, valueToSave)
        .then(() => {
          setDisplayMemo(valueToSave);
        })
        .catch(() => {
          savedRef.current = displayMemo;
          toast.error("메모 저장에 실패했습니다.");
        });
    }
  }

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-[25%] min-w-14 max-w-36 shrink-0 text-left"
              aria-label="메모 편집"
            >
              <span className="line-clamp-2 block text-xs leading-tight text-muted-foreground">
                {displayMemo || <span className="opacity-40">메모...</span>}
              </span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        {!popoverOpen && displayMemo && (
          <TooltipContent
            side="left"
            className="max-w-64 whitespace-pre-wrap text-xs"
          >
            {displayMemo}
          </TooltipContent>
        )}
        <PopoverContent className="w-64" onClick={(e) => e.stopPropagation()}>
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
            placeholder="메모..."
            className="resize-none text-xs"
            autoFocus
          />
        </PopoverContent>
      </Tooltip>
    </Popover>
  );
}

function CompactRow({ case: c }: { case: Case }) {
  const router = useRouter();

  const cc = c.ccs?.[0] ?? c.cc ?? null;
  const extraCount = (c.ccs?.length ?? 0) > 1 ? c.ccs!.length - 1 : 0;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(`/cases/${c.id}`);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/cases/${c.id}`)}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer items-center gap-1.5 border-b px-3 py-2 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BedBadge
        bedZone={c.bed_zone as BedZone}
        bedNumber={c.bed_number}
        bedExplicitlySet={c.bed_explicitly_set}
        size="sm"
      />

      <div className="flex min-w-0 flex-1 items-center gap-1">
        <span className="min-w-0 truncate text-xs font-medium">
          {cc ?? (
            <span className="italic text-muted-foreground">C.C 미입력</span>
          )}
        </span>
        {extraCount > 0 && (
          <span className="shrink-0 rounded-full bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
            +{extraCount}
          </span>
        )}
      </div>

      <StatusIcon status={c.status as CaseStatus} />

      <NotifyCell
        caseId={c.id}
        initial={(c.notify_status as NotifyStatus) ?? null}
      />

      <MemoCell caseId={c.id} initial={c.memo ?? ""} />
    </div>
  );
}

interface CompactStatusListProps {
  cases: Case[];
}

export function CompactStatusList({ cases }: CompactStatusListProps) {
  if (cases.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        현재 응급실에 환자가 없습니다.
      </p>
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
    <TooltipProvider>
      <div className="flex flex-col">
        {ZONE_ORDER.filter((zone) => grouped[zone].length > 0).map((zone) => (
          <div key={zone}>
            <p className="sticky top-0 z-10 border-b bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
              {ZONE_LABELS[zone]}
            </p>
            {grouped[zone].map((c) => (
              <CompactRow key={c.id} case={c} />
            ))}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
