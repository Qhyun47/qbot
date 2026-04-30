"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
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
import { CcAutocomplete } from "@/components/cases/cc-autocomplete";
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
import { cn } from "@/lib/utils";
import {
  createCase,
  updateCaseBed,
  updateCaseCc,
  addCaseInput,
  deleteCase,
  overrideTemplateKey,
  reorderCaseInputs,
  moveCaseInputSection,
  deleteCaseInput,
  updateCaseInputText,
} from "@/lib/cases/actions";
import type { CcConnectionEntry } from "@/lib/ai/resources/cc-types";
import type {
  BedZone,
  CaseInput,
  FoldFallbackLayout,
  InputLayout,
} from "@/lib/supabase/types";

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
  const [bedPickerOpen, setBedPickerOpen] = useState(true);
  const [cc, setCc] = useState<string | null>(null);
  const [ccEditing, setCcEditing] = useState(true);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(
    null
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
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevCardsLengthRef = useRef(0);
  // caseId가 아직 없을 때 선택된 베드/CC를 임시 보관 — createCase() 응답 전 선택 시 유실 방지
  const pendingBedRef = useRef<{ zone: BedZone; number: number } | null>(null);
  const pendingCcRef = useRef<{
    cc: string;
    hasTemplate: boolean;
    templateKey: string | null;
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
    if (pendingCcRef.current) {
      const { cc: pendingCc, hasTemplate, templateKey } = pendingCcRef.current;
      pendingCcRef.current = null;
      startTransition(() =>
        updateCaseCc(caseId, pendingCc, hasTemplate, templateKey)
      );
    }
  }, [caseId]);

  // Android Chrome: 키보드가 올라오면 visual viewport가 스크롤되어
  // fixed 컨테이너가 화면 위로 밀려나는 문제를 보정
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      el.style.top = `${vv.offsetTop}px`;
      el.style.height = `${vv.height}px`;
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

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

  useLayoutEffect(() => {
    if (document.documentElement.getAttribute("data-view") === "desktop") {
      setSetupDone(true);
    }
  }, []);

  const navigateToDashboard = () => {
    // router.refresh()로 라우터 캐시를 무효화한 후 이동 → 현황판에 최신 케이스 반영
    router.refresh();
    router.push("/dashboard");
  };

  const handleDeleteCase = async () => {
    if (caseId) {
      try {
        await deleteCase(caseId);
        // deleteCase 내부에서 revalidatePath("/dashboard") 호출됨
      } catch {
        // 삭제 실패해도 대시보드로 이동 (의도적)
      }
    }
    navigateToDashboard();
  };

  const handleBack = async () => {
    const hasBed = bedNumber !== null;
    const hasCC = cc !== null;
    const hasCards = cards.length > 0;

    // 아무것도 입력하지 않은 상태 → 자동 삭제
    if (!hasBed && !hasCC && !hasCards) {
      setNavigatingBack(true);
      await handleDeleteCase();
      return;
    }

    // 3가지 조건 모두 충족 → 자동 저장
    if (hasBed && hasCC && hasCards) {
      setNavigatingBack(true);
      navigateToDashboard();
      return;
    }

    // 일부만 입력된 상태 → 확인 다이얼로그
    setShowSaveDialog(true);
  };

  const handleSetupConfirm = () => {
    setSetupExiting(true);
  };

  const handleSetupSkip = () => {
    setBedPickerOpen(false);
    setCcEditing(false);
    setSetupExiting(true);
  };

  const handleBedChange = (zone: BedZone, number: number | null) => {
    setBedZone(zone);
    setBedNumber(number);
    if (number !== null) {
      setBedPickerOpen(false);
      if (caseId) {
        startTransition(() => updateCaseBed(caseId, zone, number));
      } else {
        pendingBedRef.current = { zone, number };
      }
    }
  };

  const handleCcSelect = (
    selectedCc: string,
    _hasTemplate: boolean,
    templateEntries: CcConnectionEntry[]
  ) => {
    setCc(selectedCc);
    setCcEditing(false);

    if (templateEntries.length === 0) {
      setPendingTemplateKeys(null);
      setSelectedTemplateKey(null);
      if (caseId) {
        startTransition(() => updateCaseCc(caseId, selectedCc, false, null));
      } else {
        pendingCcRef.current = {
          cc: selectedCc,
          hasTemplate: false,
          templateKey: null,
        };
      }
      return;
    }

    const rank0 = templateEntries.find((e) => e.rank === 0);
    if (templateEntries.length === 1 || rank0) {
      const key = rank0?.key ?? templateEntries[0].key;
      setPendingTemplateKeys(null);
      setSelectedTemplateKey(key);
      if (caseId) {
        startTransition(() => updateCaseCc(caseId, selectedCc, true, key));
      } else {
        pendingCcRef.current = {
          cc: selectedCc,
          hasTemplate: true,
          templateKey: key,
        };
      }
    } else {
      const sortedKeys = [...templateEntries]
        .sort((a, b) => a.rank - b.rank)
        .map((e) => e.key);
      setPendingTemplateKeys(sortedKeys);
      setSelectedTemplateKey(null);
    }
  };

  const handleTemplateKeyConfirm = (key: string | null) => {
    setPendingTemplateKeys(null);
    setSelectedTemplateKey(key);
    if (caseId && cc) {
      startTransition(() => updateCaseCc(caseId, cc, key !== null, key));
    }
  };

  const handleGuidelineChange = (_guideKey: string) => {
    // GuidelinePanel 내부에서 콘텐츠 로드까지 처리
  };

  const handleTemplateChange = (newTemplateKey: string | null) => {
    setSelectedTemplateKey(newTemplateKey);
    if (caseId) {
      startTransition(() => overrideTemplateKey(caseId, newTemplateKey));
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
      {/* BedPicker·CC·카드 타임라인을 하나의 스크롤 영역으로 묶음 —
          키보드가 올라와 공간이 줄어들어도 잘리지 않고 스크롤로 접근 가능 */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto overscroll-y-contain"
      >
        {bedPickerOpen && (
          <>
            <div className="p-4">
              <BedPicker
                bedZone={bedZone}
                bedNumber={bedNumber}
                onChange={handleBedChange}
              />
            </div>
            <Separator />
          </>
        )}
        {ccEditing && (
          <>
            <div className="p-4">
              <CcAutocomplete value={cc ?? ""} onSelect={handleCcSelect} />
            </div>
            <Separator />
          </>
        )}
        {!ccEditing &&
          pendingTemplateKeys &&
          pendingTemplateKeys.length >= 2 && (
            <>
              <div className="p-4">
                <p className="mb-2 text-sm font-medium">
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
                    const catLabel = entry?.category?.replace(/^\d+\.\s*/, "");
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
              <Separator />
            </>
          )}
        <div className="p-4">
          <CardTimeline
            cards={cards}
            onReorder={handleCardReorder}
            onDelete={handleCardDelete}
            onEdit={handleCardEdit}
          />
        </div>
      </div>
      <CardInputBar onSubmit={handleCardSubmit} caseId={caseId ?? undefined} />
    </div>
  );

  const GuideArea = (
    <div className="h-full">
      <GuidelinePanel
        cc={cc}
        templateKey={selectedTemplateKey}
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
                await handleDeleteCase();
              }}
            >
              삭제
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowSaveDialog(false);
                navigateToDashboard();
              }}
            >
              저장
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
            <span className="flex-1 text-sm font-semibold">새 케이스 입력</span>
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
            <CcAutocomplete value={cc ?? ""} onSelect={handleCcSelect} />
          </div>
          <div className="shrink-0 border-t p-4">
            <Button className="w-full" onClick={handleSetupConfirm}>
              확인
            </Button>
          </div>
        </div>
      )}
      <div
        ref={rootRef}
        className="fixed inset-0 flex flex-col"
        style={{ fontSize: `${activeFontSize}px` }}
      >
        {/* 페이지 헤더 */}
        <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
          {/* 뒤로가기 */}
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

          <span className="shrink-0 text-sm font-semibold">새 케이스 입력</span>

          {/* 헤더 칩: 베드 배지 (접힌 상태일 때만 표시) */}
          {!bedPickerOpen && bedNumber !== null && (
            <button
              type="button"
              onClick={() => setBedPickerOpen(true)}
              className="shrink-0"
              aria-label="베드 선택 열기"
            >
              <BedBadge bedZone={bedZone} bedNumber={bedNumber} size="sm" />
            </button>
          )}

          {/* 헤더 칩: CC 텍스트 (접힌 상태일 때만 표시) */}
          {!ccEditing && (
            <button
              type="button"
              onClick={() => setCcEditing(true)}
              className="rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted"
              aria-label="C.C 편집"
            >
              {cc ?? <span className="text-muted-foreground">C.C 입력</span>}
            </button>
          )}

          <div className="flex flex-1 items-center justify-end gap-2">
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
            first={InputArea}
            second={GuideArea}
            defaultFirstPercent={defaultSplitRatio}
          />
        )}
      </div>
    </>
  );
}
