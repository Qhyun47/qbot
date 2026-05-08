"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BedPicker } from "@/components/cases/bed-picker";
import { MultiCcInput } from "@/components/cases/multi-cc-input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import templateListJson from "@/lib/ai/resources/template-list.json";
import ccListRaw from "@/lib/ai/resources/cc-list.json";
import { mergeCcTemplateEntries } from "@/lib/ai/resources/cc-types";
import {
  createCase,
  updateCaseBed,
  updateCaseCcs,
  deleteCase,
} from "@/lib/cases/actions";
import type {
  CcConnectionEntry,
  CcListEntry,
} from "@/lib/ai/resources/cc-types";
import type { BedZone } from "@/lib/supabase/types";

const ccList = ccListRaw as CcListEntry[];

interface NewCaseSetupDialogProps {
  onClose: () => void;
}

export function NewCaseSetupDialog({ onClose }: NewCaseSetupDialogProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [caseId, setCaseId] = useState<string | null>(null);
  const [bedZone, setBedZone] = useState<BedZone | null>(null);
  const [bedNumber, setBedNumber] = useState<number | null>(null);
  const [setupCcs, setSetupCcs] = useState<string[]>([]);
  const [pendingTemplateKeys, setPendingTemplateKeys] = useState<
    string[] | null
  >(null);
  const [navigating, setNavigating] = useState(false);
  const [closing, setClosing] = useState(false);

  const pendingBedRef = useRef<{ zone: BedZone; number: number } | null>(null);
  const pendingCcsRef = useRef<{
    ccs: string[];
    templateKeys: string[];
  } | null>(null);
  const freshRef = useRef(Date.now());

  useEffect(() => {
    createCase().then((id) => setCaseId(id));
  }, []);

  // caseId가 준비되면 임시 보관된 베드/CC를 즉시 저장
  useEffect(() => {
    if (!caseId) return;
    if (pendingBedRef.current) {
      const { zone, number } = pendingBedRef.current;
      pendingBedRef.current = null;
      startTransition(() => updateCaseBed(caseId, zone, number));
    }
    if (pendingCcsRef.current) {
      const { ccs, templateKeys } = pendingCcsRef.current;
      pendingCcsRef.current = null;
      startTransition(() => updateCaseCcs(caseId, ccs, templateKeys));
    }
  }, [caseId]);

  const handleBedChange = (zone: BedZone, number: number | null) => {
    setBedZone(zone);
    setBedNumber(number);
    if (number !== null) {
      if (caseId) {
        startTransition(() => updateCaseBed(caseId, zone, number));
      } else {
        pendingBedRef.current = { zone, number };
      }
    }
  };

  const navigateToForm = (
    finalCcs: string[],
    templateKeys: string[],
    resolvedCaseId: string
  ) => {
    const params = new URLSearchParams();
    params.set("caseId", resolvedCaseId);
    params.set("fresh", String(freshRef.current));
    if (bedZone && bedNumber !== null) {
      params.set("bedZone", bedZone);
      params.set("bedNumber", String(bedNumber));
    }
    if (finalCcs.length > 0) params.set("ccs", finalCcs.join(","));
    if (templateKeys.length > 0)
      params.set("templateKeys", templateKeys.join(","));
    router.push(`/cases/new?${params.toString()}`);
  };

  const finalizeSetup = (finalCcs: string[], templateKeys: string[]) => {
    if (!caseId) return;
    setNavigating(true);

    if (finalCcs.length > 0) {
      startTransition(() => updateCaseCcs(caseId, finalCcs, templateKeys));
    }

    navigateToForm(finalCcs, templateKeys, caseId);
  };

  const handleSetupConfirm = () => {
    if (!caseId) return;

    if (setupCcs.length === 0) {
      setNavigating(true);
      navigateToForm([], [], caseId);
      return;
    }

    const mergedEntries = mergeCcTemplateEntries(setupCcs, ccList);
    const rank0 = mergedEntries.find((e) => e.rank === 0);
    if (mergedEntries.length === 0 || mergedEntries.length === 1 || rank0) {
      const key = rank0?.key ?? mergedEntries[0]?.key ?? null;
      finalizeSetup(setupCcs, key ? [key] : []);
    } else {
      setPendingTemplateKeys(mergedEntries.map((e) => e.key));
    }
  };

  const handleSetupSkip = () => {
    if (!caseId) return;
    setNavigating(true);
    navigateToForm([], [], caseId);
  };

  const handleTemplateKeyConfirm = (key: string | null) => {
    finalizeSetup(setupCcs, key ? [key] : []);
  };

  const handleBack = async () => {
    if (closing) return;
    setClosing(true);
    if (caseId) {
      try {
        await deleteCase(caseId);
      } catch {
        // 삭제 실패해도 닫기 진행
      }
    }
    onClose();
  };

  const isConfirmDisabled = !caseId || navigating || closing;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={closing || navigating}
          aria-label="뒤로 가기"
        >
          {closing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowLeft className="size-4" />
          )}
        </Button>
        <span className="flex-1 text-sm font-semibold">환자 추가</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={handleSetupSkip}
          disabled={isConfirmDisabled}
        >
          {navigating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "건너뛰기"
          )}
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <BedPicker
          bedZone={bedZone}
          bedNumber={bedNumber}
          onChange={handleBedChange}
        />
        <Separator />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            C.C (Chief Complaint)
          </label>
          <MultiCcInput
            values={setupCcs}
            onChange={(newCcs: string[], _lastEntries: CcConnectionEntry[]) =>
              setSetupCcs(newCcs)
            }
          />
        </div>

        {pendingTemplateKeys && pendingTemplateKeys.length >= 2 && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">어떤 상용구로 생성할까요?</p>
              <div className="flex flex-wrap gap-2">
                {pendingTemplateKeys.map((key) => {
                  const entry = (
                    templateListJson as {
                      templateKey: string;
                      displayName: string;
                      category?: string;
                    }[]
                  ).find((t) => t.templateKey === key);
                  const label = entry?.displayName ?? key;
                  const catLabel = entry?.category?.replace(/^\d+\.\s*/, "");
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateKeyConfirm(key)}
                      className="gap-1.5"
                      disabled={navigating}
                    >
                      {label}
                      {catLabel && (
                        <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {catLabel}
                        </span>
                      )}
                    </Button>
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => handleTemplateKeyConfirm(null)}
                  disabled={navigating}
                >
                  상용구 없이 진행
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {!pendingTemplateKeys && (
        <div className="shrink-0 border-t p-4">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSetupConfirm}
            disabled={isConfirmDisabled}
          >
            {navigating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : !caseId ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                준비 중...
              </>
            ) : (
              "확인"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
