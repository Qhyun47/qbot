"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rows2, Columns2, Square, Zap } from "lucide-react";
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
} from "@/lib/cases/actions";
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
  canUseAi?: boolean;
}

export function NewCaseForm({
  defaultLayout,
  defaultSplitRatio,
  foldAutoSwitch,
  foldFallbackLayout,
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
  const [generating, setGenerating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [, startTransition] = useTransition();

  const [optimisticCards, addOptimisticCard] = useOptimistic(
    cards,
    (state: CaseInput[], newCard: CaseInput) => [newCard, ...state]
  );

  useEffect(() => {
    createCase().then((id) => setCaseId(id));
  }, []);

  useEffect(() => {
    if (!foldAutoSwitch) return;
    const mq = window.matchMedia("(max-width: 600px)");
    const handler = (e: MediaQueryListEvent) => {
      setLayout(e.matches ? foldFallbackLayout : defaultLayout);
    };
    setLayout(mq.matches ? foldFallbackLayout : defaultLayout);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [foldAutoSwitch, defaultLayout, foldFallbackLayout]);

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
      await handleDeleteCase();
      return;
    }

    // 3가지 조건 모두 충족 → 자동 저장
    if (hasBed && hasCC && hasCards) {
      navigateToDashboard();
      return;
    }

    // 일부만 입력된 상태 → 확인 다이얼로그
    setShowSaveDialog(true);
  };

  const handleBedChange = (zone: BedZone, number: number | null) => {
    setBedZone(zone);
    setBedNumber(number);
    if (number !== null) {
      setBedPickerOpen(false);
      if (caseId) startTransition(() => updateCaseBed(caseId, zone, number));
    }
  };

  const handleCcSelect = (
    selectedCc: string,
    hasTemplate: boolean,
    templateKeys: string[]
  ) => {
    setCc(selectedCc);
    setCcEditing(false);

    if (templateKeys.length >= 2) {
      setPendingTemplateKeys(templateKeys);
      setSelectedTemplateKey(null);
    } else {
      const key = templateKeys[0] ?? null;
      setPendingTemplateKeys(null);
      setSelectedTemplateKey(key);
      startTransition(() => {
        if (caseId) updateCaseCc(caseId, selectedCc, hasTemplate, key);
      });
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

  const handleCardSubmit = (
    rawText: string,
    timeTag: string | null,
    timeOffsetMinutes: number | null
  ) => {
    if (!caseId) return;
    const tempCard: CaseInput = {
      id: crypto.randomUUID(),
      case_id: caseId,
      raw_text: rawText,
      time_tag: timeTag,
      time_offset_minutes: timeOffsetMinutes,
      display_order: cards.length + 1,
      created_at: new Date().toISOString(),
    };
    startTransition(async () => {
      addOptimisticCard(tempCard);
      const saved = await addCaseInput(
        caseId,
        rawText,
        timeTag,
        timeOffsetMinutes
      );
      setCards((prev) => [saved, ...prev]);
    });
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
    <div className="flex h-full flex-col overflow-hidden">
      {bedPickerOpen && (
        <>
          <div className="shrink-0 p-4">
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
          <div className="shrink-0 p-4">
            <CcAutocomplete value={cc ?? ""} onSelect={handleCcSelect} />
          </div>
          <Separator />
        </>
      )}
      {!ccEditing && pendingTemplateKeys && pendingTemplateKeys.length >= 2 && (
        <>
          <div className="shrink-0 p-4">
            <p className="mb-2 text-sm font-medium">
              어떤 상용구로 생성할까요?
            </p>
            <div className="flex flex-wrap gap-2">
              {pendingTemplateKeys.map((key) => {
                const label =
                  (
                    templateListJson as {
                      templateKey: string;
                      displayName: string;
                    }[]
                  ).find((t) => t.templateKey === key)?.displayName ?? key;
                return (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateKeyConfirm(key)}
                  >
                    {label}
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
      <div className="flex-1 overflow-y-auto overscroll-y-contain p-4">
        <CardTimeline cards={optimisticCards} />
      </div>
      <CardInputBar onSubmit={handleCardSubmit} />
    </div>
  );

  const GuideArea = (
    <div className="h-full">
      <GuidelinePanel
        cc={cc}
        templateKey={selectedTemplateKey}
        onGuidelineChange={handleGuidelineChange}
        onTemplateChange={handleTemplateChange}
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
      <div className="fixed inset-0 flex flex-col">
        {/* 페이지 헤더 */}
        <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
          {/* 뒤로가기 */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="size-4" />
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
