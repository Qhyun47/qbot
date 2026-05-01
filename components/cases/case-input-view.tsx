"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rows2, Columns2, Square, Zap, Loader2 } from "lucide-react";
import { ResizableSplit } from "@/components/cases/resizable-split";
import { CardInputBar } from "@/components/cases/card-input-bar";
import { CardTimeline } from "@/components/cases/card-timeline";
import { CcAutocomplete } from "@/components/cases/cc-autocomplete";
import { BedPicker } from "@/components/cases/bed-picker";
import { BedBadge } from "@/components/cases/bed-badge";
import { GuidelinePanel } from "@/components/cases/guideline-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import templateListJson from "@/lib/ai/resources/template-list.json";
import { cn } from "@/lib/utils";
import {
  updateCaseBed,
  updateCaseCcs,
  addCaseInput,
  overrideTemplateKey,
  reorderCaseInputs,
  moveCaseInputSection,
  deleteCaseInput,
  updateCaseInputText,
} from "@/lib/cases/actions";
import { loadGuideline } from "@/lib/guidelines/actions";
import type { CcConnectionEntry } from "@/lib/ai/resources/cc-types";
import type {
  BedZone,
  CaseInput,
  CaseStatus,
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

interface CaseInputViewProps {
  caseId: string;
  defaultBedZone: BedZone;
  defaultBedNumber: number;
  defaultCc: string | null;
  defaultTemplateKey: string | null;
  initialCards: CaseInput[];
  defaultLayout: InputLayout;
  defaultSplitRatio: number;
  foldAutoSwitch: boolean;
  foldFallbackLayout: FoldFallbackLayout;
  caseInputFontSize: number;
  guidelineFontSize?: number;
  status: CaseStatus;
  generatedAt?: string;
  from?: string;
}

export function CaseInputView({
  caseId,
  defaultBedZone,
  defaultBedNumber,
  defaultCc,
  defaultTemplateKey,
  initialCards,
  defaultLayout,
  defaultSplitRatio,
  foldAutoSwitch,
  foldFallbackLayout,
  caseInputFontSize,
  guidelineFontSize,
  status,
  generatedAt,
  from,
}: CaseInputViewProps) {
  const router = useRouter();
  const [bedZone, setBedZone] = useState<BedZone>(defaultBedZone);
  const [bedNumber, setBedNumber] = useState<number>(defaultBedNumber);
  const [bedPickerOpen, setBedPickerOpen] = useState(false);
  const [cc, setCc] = useState<string | null>(defaultCc);
  const [ccEditing, setCcEditing] = useState(defaultCc === null);
  const [_guidelineContent, setGuidelineContent] = useState<string | null>(
    null
  );
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(
    defaultTemplateKey
  );
  const [pendingTemplateKeys, setPendingTemplateKeys] = useState<
    string[] | null
  >(null);
  const [cards, setCards] = useState<CaseInput[]>(initialCards);
  const [layout, setLayout] = useState<InputLayout>(defaultLayout);
  const [generating, setGenerating] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [, startTransition] = useTransition();

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

  useEffect(() => {
    const original =
      document.documentElement.style.getPropertyValue("--mobile-font-size");
    document.documentElement.style.setProperty(
      "--mobile-font-size",
      `${caseInputFontSize}px`
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
  }, [caseInputFontSize]);

  useEffect(() => {
    if (defaultCc) {
      loadGuideline([defaultCc])
        .then((result) => {
          setGuidelineContent(result.mode === "auto" ? result.content : null);
        })
        .catch(() => setGuidelineContent(null));
    }
  }, [defaultCc]);

  const handleBedChange = (zone: BedZone, number: number | null) => {
    setBedZone(zone);
    if (number !== null) {
      setBedNumber(number);
      setBedPickerOpen(false);
      startTransition(() => updateCaseBed(caseId, zone, number));
    }
  };

  const handleCcSelect = (
    selectedCc: string,
    _hasTemplate: boolean,
    templateEntries: CcConnectionEntry[]
  ) => {
    setCc(selectedCc);
    setCcEditing(false);
    setGuidelineContent(null);

    const loadGuide = async () => {
      try {
        const result = await loadGuideline([selectedCc]);
        setGuidelineContent(result.mode === "auto" ? result.content : null);
      } catch {
        setGuidelineContent(null);
      }
    };

    if (templateEntries.length === 0) {
      setPendingTemplateKeys(null);
      setSelectedTemplateKey(null);
      startTransition(async () => {
        await updateCaseCcs(caseId, [selectedCc], null);
        await loadGuide();
      });
      return;
    }

    const rank0 = templateEntries.find((e) => e.rank === 0);
    if (templateEntries.length === 1 || rank0) {
      const key = rank0?.key ?? templateEntries[0].key;
      setPendingTemplateKeys(null);
      setSelectedTemplateKey(key);
      startTransition(async () => {
        await updateCaseCcs(caseId, [selectedCc], key);
        await loadGuide();
      });
    } else {
      const sortedKeys = [...templateEntries]
        .sort((a, b) => a.rank - b.rank)
        .map((e) => e.key);
      setPendingTemplateKeys(sortedKeys);
      setSelectedTemplateKey(null);
      startTransition(loadGuide);
    }
  };

  const handleTemplateKeyConfirm = (key: string | null) => {
    setPendingTemplateKeys(null);
    setSelectedTemplateKey(key);
    if (cc) {
      startTransition(() => updateCaseCcs(caseId, [cc], key));
    }
  };

  const handleGuidelineChange = (_guidelineCc: string) => {
    // GuidelinePanel 내부에서 콘텐츠 로드까지 처리
  };

  const handleTemplateChange = (newTemplateKey: string | null) => {
    setSelectedTemplateKey(newTemplateKey);
    startTransition(() => overrideTemplateKey(caseId, newTemplateKey));
  };

  const handleCardSubmit = async (
    rawText: string,
    timeTag: string | null,
    timeOffsetMinutes: number | null
  ) => {
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

  const handleGenerate = async () => {
    setGenerating(true);
    await fetch(`/api/cases/${caseId}/generate`, { method: "POST" });
    const fromParam = from ? `&from=${from}` : "";
    router.replace(`/cases/${caseId}?view=result${fromParam}`);
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
      <div className="case-input-font-scope flex-1 overflow-y-auto p-4">
        <CardTimeline
          cards={cards}
          generatedAt={generatedAt}
          onReorder={handleCardReorder}
          onDelete={handleCardDelete}
          onEdit={handleCardEdit}
        />
      </div>
      <div className="case-input-font-scope shrink-0">
        <CardInputBar onSubmit={handleCardSubmit} caseId={caseId} />
      </div>
    </div>
  );

  const GuideArea = (
    <div className="h-full">
      <GuidelinePanel
        ccs={cc ? [cc] : []}
        templateKey={selectedTemplateKey}
        onGuidelineChange={handleGuidelineChange}
        onTemplateChange={handleTemplateChange}
        guidelineFontSize={guidelineFontSize}
      />
    </div>
  );

  return (
    <div className="fixed inset-x-0 top-0 flex h-[100dvh] flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2.5">
        {/* 뒤로가기 */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            setNavigatingBack(true);
            router.push(from === "cases" ? "/cases" : "/dashboard");
          }}
          disabled={navigatingBack}
          aria-label="뒤로 가기"
        >
          {navigatingBack ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowLeft className="size-4" />
          )}
        </Button>

        {/* 헤더 칩: 베드 배지 */}
        <button
          type="button"
          onClick={() => setBedPickerOpen(true)}
          className="shrink-0"
          aria-label="베드 선택 열기"
        >
          <BedBadge bedZone={bedZone} bedNumber={bedNumber} size="sm" />
        </button>

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

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.replace(
                `/cases/${caseId}?view=result${from ? `&from=${from}` : ""}`
              )
            }
          >
            AI 차팅 보기
          </Button>

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="gap-1.5"
          >
            <Zap className="size-3.5" />
            {generating
              ? "생성 중..."
              : status === "draft"
                ? "차팅 생성"
                : "재생성"}
          </Button>
        </div>
      </header>

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
  );
}
