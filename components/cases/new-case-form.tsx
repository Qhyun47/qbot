"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rows2, Columns2, Square, Zap, Loader2 } from "lucide-react";
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
import { ResizableSplit } from "@/components/cases/resizable-split";
import { CardInputBar } from "@/components/cases/card-input-bar";
import { CardTimeline } from "@/components/cases/card-timeline";
import { MultiCcInput } from "@/components/cases/multi-cc-input";
import { BedPicker } from "@/components/cases/bed-picker";
import { BedBadge } from "@/components/cases/bed-badge";
import { GuidelinePanel } from "@/components/cases/guideline-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import templateListJson from "@/lib/ai/resources/template-list.json";
import ccListRaw from "@/lib/ai/resources/cc-list.json";
import { cn } from "@/lib/utils";
import {
  createCase,
  updateCaseBed,
  updateCaseCcs,
  addCaseInput,
  deleteCase,
  overrideTemplateKeys,
  reorderCaseInputs,
  moveCaseInputSection,
  deleteCaseInput,
  updateCaseInputText,
} from "@/lib/cases/actions";
import type {
  CcConnectionEntry,
  CcListEntry,
} from "@/lib/ai/resources/cc-types";
import { mergeCcTemplateEntries } from "@/lib/ai/resources/cc-types";
import type {
  BedZone,
  CaseInput,
  FoldFallbackLayout,
  InputLayout,
} from "@/lib/supabase/types";

const ccList = ccListRaw as CcListEntry[];

const LAYOUT_OPTIONS: {
  value: InputLayout;
  Icon: React.FC<{ className?: string }>;
  label: string;
}[] = [
  { value: "single", Icon: Square, label: "단독" },
  { value: "split_vertical", Icon: Rows2, label: "상하" },
  { value: "split_horizontal", Icon: Columns2, label: "좌우" },
];

interface NewCaseFormProps {
  defaultLayout: InputLayout;
  defaultSplitRatio: number;
  foldAutoSwitch: boolean;
  foldFallbackLayout: FoldFallbackLayout;
  caseInputFontSize: number;
  foldCaseInputFontSize: number;
  guidelineFontSize?: number;
  foldGuidelineFontSize?: number;
  canUseAi?: boolean;
}

export function NewCaseForm({
  defaultLayout,
  defaultSplitRatio,
  foldAutoSwitch,
  foldFallbackLayout,
  caseInputFontSize,
  foldCaseInputFontSize,
  guidelineFontSize,
  foldGuidelineFontSize,
  canUseAi = false,
}: NewCaseFormProps) {
  const router = useRouter();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [bedZone, setBedZone] = useState<BedZone>("A");
  const [bedNumber, setBedNumber] = useState<number | null>(null);
  const [ccs, setCcs] = useState<string[]>([]);
  const [setupCcs, setSetupCcs] = useState<string[]>([]);
  const [selectedTemplateKeys, setSelectedTemplateKeys] = useState<string[]>(
    []
  );
  const [pendingTemplateKeys, setPendingTemplateKeys] = useState<
    string[] | null
  >(null);
  const [cards, setCards] = useState<CaseInput[]>([]);
  const [layout, setLayout] = useState<InputLayout>(defaultLayout);
  const [activeFontSize, setActiveFontSize] = useState(caseInputFontSize);
  const [activeGuidelineFontSize, setActiveGuidelineFontSize] =
    useState(guidelineFontSize);
  const [generating, setGenerating] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [setupExiting, setSetupExiting] = useState(false);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  useVisualViewport(containerRef);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevCardsLengthRef = useRef(0);
  const pendingBedRef = useRef<{ zone: BedZone; number: number } | null>(null);
  const pendingCcsRef = useRef<{
    ccs: string[];
    templateKeys: string[];
  } | null>(null);

  useEffect(() => {
    createCase().then((id) => setCaseId(id));
  }, []);

  // caseId가 생기면 임시 보관된 베드/CC를 즉시 저장
  useEffect(() => {
    if (!caseId) return;
    if (pendingBedRef.current) {
      const { zone, number } = pendingBedRef.current;
      pendingBedRef.current = null;
      startTransition(() => updateCaseBed(caseId, zone, number));
    }
    if (pendingCcsRef.current) {
      const { ccs: pendingCcs, templateKeys } = pendingCcsRef.current;
      pendingCcsRef.current = null;
      startTransition(() => updateCaseCcs(caseId, pendingCcs, templateKeys));
    }
  }, [caseId]);

  useEffect(() => {
    const original =
      document.documentElement.style.getPropertyValue("--mobile-font-size");
    document.documentElement.style.setProperty(
      "--mobile-font-size",
      `${activeFontSize}px`
    );
    return () => {
      if (original) {
        document.documentElement.style.setProperty(
          "--mobile-font-size",
          original
        );
      } else {
        document.documentElement.style.removeProperty("--mobile-font-size");
      }
    };
  }, [activeFontSize]);

  useEffect(() => {
    if (!foldAutoSwitch || defaultLayout !== "split_horizontal") return;
    const mq = window.matchMedia("(max-width: 600px)");
    const applyFoldState = (isFolded: boolean) => {
      setLayout(isFolded ? foldFallbackLayout : defaultLayout);
      setActiveFontSize(isFolded ? foldCaseInputFontSize : caseInputFontSize);
      setActiveGuidelineFontSize(
        isFolded ? foldGuidelineFontSize : guidelineFontSize
      );
    };
    const handler = (e: MediaQueryListEvent) => applyFoldState(e.matches);
    applyFoldState(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [
    foldAutoSwitch,
    defaultLayout,
    foldFallbackLayout,
    foldCaseInputFontSize,
    caseInputFontSize,
    guidelineFontSize,
    foldGuidelineFontSize,
  ]);

  useEffect(() => {
    if (cards.length > prevCardsLengthRef.current && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
    prevCardsLengthRef.current = cards.length;
  }, [cards.length]);

  const navigateToDashboard = () => {
    router.refresh();
    router.push("/dashboard");
  };

  const handleDeleteCase = async () => {
    if (caseId) {
      try {
        await deleteCase(caseId);
      } catch {
        // 삭제 실패해도 대시보드로 이동 (의도적)
      }
    }
    navigateToDashboard();
  };

  const handleBack = async () => {
    const hasBed = bedNumber !== null;
    const hasCC = ccs.length > 0;
    const hasCards = cards.length > 0;

    if (!hasBed && !hasCC && !hasCards) {
      setNavigatingBack(true);
      await handleDeleteCase();
      return;
    }

    if (hasBed && hasCC && hasCards) {
      setNavigatingBack(true);
      navigateToDashboard();
      return;
    }

    setShowSaveDialog(true);
  };

  const finalizeSetup = (finalCcs: string[], templateKeys: string[]) => {
    setCcs(finalCcs);
    setSelectedTemplateKeys(templateKeys);
    if (caseId) {
      startTransition(() => updateCaseCcs(caseId, finalCcs, templateKeys));
    } else {
      pendingCcsRef.current = { ccs: finalCcs, templateKeys };
    }
    setPendingTemplateKeys(null);
    setSetupExiting(true);
  };

  const handleSetupConfirm = () => {
    if (setupCcs.length === 0) {
      setSetupExiting(true);
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
    setSetupExiting(true);
  };

  const handleTemplateKeyConfirm = (key: string | null) => {
    finalizeSetup(setupCcs, key ? [key] : []);
  };

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

  const handleOpenSetup = () => {
    setSetupCcs(ccs);
    setPendingTemplateKeys(null);
    setSetupExiting(false);
    setSetupDone(false);
  };

  const handleGuidelineChange = (_guideKey: string) => {
    // GuidelinePanel 내부에서 콘텐츠 로드까지 처리
  };

  const handleTemplateChange = (keys: string[]) => {
    setSelectedTemplateKeys(keys);
    if (caseId) {
      startTransition(() => overrideTemplateKeys(caseId, keys));
    }
  };

  const handleCardReorder = (
    newCards: CaseInput[],
    movedId: string,
    targetSection: "timed" | "untimed" | null
  ) => {
    setCards(newCards);
    startTransition(async () => {
      const orderUpdates = newCards.map((c) => ({
        id: c.id,
        displayOrder: c.display_order,
      }));
      await reorderCaseInputs(orderUpdates);
      if (targetSection) {
        await moveCaseInputSection(movedId, targetSection);
      }
    });
  };

  const handleCardDelete = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    startTransition(() => deleteCaseInput(cardId));
  };

  const handleCardEdit = (cardId: string, newText: string) => {
    startTransition(async () => {
      const updated = await updateCaseInputText(cardId, newText);
      setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
    });
  };

  const handleCardSubmit = async (
    rawText: string,
    timeTag: string | null,
    timeOffsetMinutes: number | null
  ) => {
    if (!caseId) return;
    const tempId = crypto.randomUUID();
    const tempCard: CaseInput = {
      id: tempId,
      case_id: caseId,
      raw_text: rawText,
      time_tag: timeTag,
      time_offset_minutes: timeOffsetMinutes,
      section_override: null,
      display_order: cards.length + 1,
      created_at: new Date().toISOString(),
    };
    setCards((prev) => [...prev, tempCard]);
    try {
      const saved = await addCaseInput(
        caseId,
        rawText,
        timeTag,
        timeOffsetMinutes
      );
      setCards((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
    } catch {
      setCards((prev) => prev.filter((c) => c.id !== tempId));
    }
  };

  const handleGenerate = async () => {
    if (!caseId || cards.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/generate`, {
        method: "POST",
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        alert(
          data.error ??
            "오늘 AI 차팅 생성 한도(50회)를 초과했습니다. 내일 다시 시도해주세요."
        );
        setGenerating(false);
        return;
      }
      router.replace(`/cases/${caseId}?view=result`);
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setGenerating(false);
    }
  };

  const InputArea = (
    <div className="flex h-full flex-col">
      <div
        ref={scrollAreaRef}
        className="case-input-font-scope flex-1 overflow-y-auto overscroll-y-contain"
      >
        <div className="p-4">
          <CardTimeline
            cards={cards}
            onReorder={handleCardReorder}
            onDelete={handleCardDelete}
            onEdit={handleCardEdit}
          />
        </div>
      </div>
      <div className="case-input-font-scope shrink-0">
        <CardInputBar
          onSubmit={handleCardSubmit}
          caseId={caseId ?? undefined}
        />
      </div>
    </div>
  );

  const GuideArea = (
    <div className="h-full">
      <GuidelinePanel
        ccs={ccs}
        templateKeys={selectedTemplateKeys}
        onGuidelineChange={handleGuidelineChange}
        onTemplateChange={handleTemplateChange}
        guidelineFontSize={activeGuidelineFontSize}
      />
    </div>
  );

  return (
    <>
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>저장할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              입력 중인 내용을 저장하면 현황판에서 확인할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                setShowSaveDialog(false);
                setNavigatingBack(true);
                await handleDeleteCase();
              }}
            >
              삭제
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowSaveDialog(false);
                setNavigatingBack(true);
                navigateToDashboard();
              }}
            >
              저장
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 설정 화면 (데스크탑+모바일 공통) */}
      {!setupDone && (
        <div
          className={cn(
            "fixed inset-0 z-10 flex flex-col bg-background transition-transform duration-300",
            setupExiting && "-translate-y-full"
          )}
          onTransitionEnd={() => {
            if (setupExiting) setSetupDone(true);
          }}
        >
          <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={navigatingBack}
              aria-label="뒤로 가기"
            >
              {navigatingBack ? (
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
            >
              건너뛰기
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
                onChange={(
                  newCcs: string[],
                  _lastEntries: CcConnectionEntry[]
                ) => setSetupCcs(newCcs)}
              />
            </div>

            {/* 상용구 선택 단계 (설정 화면 내) */}
            {pendingTemplateKeys && pendingTemplateKeys.length >= 2 && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">
                    어떤 상용구로 생성할까요?
                  </p>
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
                      const catLabel = entry?.category?.replace(
                        /^\d+\.\s*/,
                        ""
                      );
                      return (
                        <Button
                          key={key}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTemplateKeyConfirm(key)}
                          className="gap-1.5"
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
              <Button className="w-full" size="lg" onClick={handleSetupConfirm}>
                확인
              </Button>
            </div>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className="fixed inset-x-0 top-0 flex h-[100dvh] flex-col"
      >
        {/* 페이지 헤더 */}
        <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleBack}
            disabled={navigatingBack}
            aria-label="뒤로 가기"
          >
            {navigatingBack ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowLeft className="size-4" />
            )}
          </Button>

          {/* 헤더 칩: 베드 배지 (클릭 시 설정 화면 재오픈) */}
          {bedNumber !== null && (
            <button
              type="button"
              onClick={handleOpenSetup}
              className="shrink-0"
              aria-label="베드 선택 변경"
            >
              <BedBadge bedZone={bedZone} bedNumber={bedNumber} size="sm" />
            </button>
          )}

          {/* 헤더 칩: 다중 CC (클릭 시 설정 화면 재오픈, 한 줄 truncate) */}
          {ccs.length > 0 && (
            <button
              type="button"
              onClick={handleOpenSetup}
              className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden rounded-full border px-2 py-0.5 text-left hover:bg-muted"
              aria-label="C.C 변경"
            >
              <span className="shrink-0 text-xs">{ccs[0]}</span>
              {ccs.length > 1 && (
                <span className="min-w-0 truncate text-xs text-muted-foreground">
                  , {ccs.slice(1).join(", ")}
                </span>
              )}
            </button>
          )}

          <div className="flex shrink-0 items-center justify-end gap-2">
            {/* 레이아웃 전환 토글 */}
            <div className="hidden items-center gap-0.5 rounded-md border p-0.5 is-desktop:flex">
              {LAYOUT_OPTIONS.map(({ value, Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${label} 레이아웃`}
                  title={label}
                  onClick={() => setLayout(value)}
                  className={cn(
                    "rounded p-1.5 transition-colors",
                    layout === value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={canUseAi ? -1 : 0}>
                    <Button
                      size="sm"
                      onClick={handleGenerate}
                      disabled={
                        !caseId || cards.length === 0 || generating || !canUseAi
                      }
                      className="gap-1.5"
                    >
                      <Zap className="size-3.5" />
                      {generating ? "생성 중..." : "차팅 생성"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canUseAi && (
                  <TooltipContent side="bottom">
                    <p>관리자 승인 후 사용 가능합니다.</p>
                    <p className="text-xs text-muted-foreground">
                      설정 페이지에서 신청하세요.
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* 레이아웃 본문 */}
        {layout === "single" && (
          <div className="flex-1 overflow-hidden">{InputArea}</div>
        )}

        {layout === "split_vertical" && (
          <ResizableSplit
            direction="vertical"
            first={GuideArea}
            second={InputArea}
            defaultFirstPercent={defaultSplitRatio}
          />
        )}

        {layout === "split_horizontal" && (
          <ResizableSplit
            direction="horizontal"
            first={GuideArea}
            second={InputArea}
            defaultFirstPercent={defaultSplitRatio}
          />
        )}
      </div>
    </>
  );
}
