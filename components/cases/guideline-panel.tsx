"use client";

import { Fragment, useEffect, useState } from "react";
import { BookOpen, FileText, Layers } from "lucide-react";
import {
  loadGuideline,
  loadGuideByKey,
  loadTemplateContent,
} from "@/lib/guidelines/actions";
import type { TemplateContent } from "@/lib/guidelines/actions";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { HtmlPreview } from "@/components/ui/html-preview";
import { PdfViewer } from "@/components/ui/pdf-viewer";
import ccListRaw from "@/lib/ai/resources/cc-list.json";
import templateListRaw from "@/lib/ai/resources/template-list.json";
import guideListRaw from "@/lib/ai/resources/guide-list.json";
import categoriesRaw from "@/lib/ai/resources/template-categories.json";
import type { CcListEntry } from "@/lib/ai/resources/cc-types";
import { mergeCcTemplateEntries } from "@/lib/ai/resources/cc-types";

interface TemplateListEntry {
  templateKey: string;
  displayName: string;
  category?: string;
}

interface GuideListEntry {
  guideKey: string;
  displayName: string;
  dividerAfter?: boolean;
}

const ccList = ccListRaw as CcListEntry[];
const templateList = templateListRaw as TemplateListEntry[];
const guideList = guideListRaw as GuideListEntry[];
const allCategories = categoriesRaw as string[];

const CIRCLED = ["①", "②", "③"];

function getCategoryLabel(category: string): string {
  return category.replace(/^\d+\.\s*/, "");
}

interface GuidelinePanelProps {
  ccs: string[];
  templateKeys: string[];
  onGuidelineChange: (guideKey: string) => void;
  onTemplateChange: (templateKeys: string[]) => void;
  guidelineFontSize?: number;
}

function getGuideLabel(guideKey: string): string {
  return (
    guideList.find((g) => g.guideKey === guideKey)?.displayName ?? guideKey
  );
}

function getTemplateLabel(key: string): string | null {
  return templateList.find((t) => t.templateKey === key)?.displayName ?? key;
}

/** 다중 CC 기준 rank 오름차순 머지된 templateKey 문자열 배열 반환 */
function getSuggestedTemplateKeys(ccs: string[]): string[] {
  return mergeCcTemplateEntries(ccs, ccList).map((e) => e.key);
}

function TabButton({
  icon,
  label,
  subLabel,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subLabel?: string | null;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-start gap-0.5 border-b-2 px-3 py-2.5 text-left transition-colors",
        "select-none",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground/70",
        "disabled:cursor-default disabled:opacity-40"
      )}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      {subLabel && (
        <span className="w-full truncate text-xs font-normal normal-case text-muted-foreground">
          {subLabel}
        </span>
      )}
    </button>
  );
}

function TemplateSectionBlock({
  title,
  subtitle,
  content,
  fontSize,
}: {
  title: string;
  subtitle?: string;
  content: string;
  fontSize?: number;
}) {
  if (!content) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {subtitle && (
          <span className="text-[10px] normal-case tracking-normal text-muted-foreground/60">
            {subtitle}
          </span>
        )}
      </div>
      <pre
        className="overflow-x-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs leading-relaxed"
        style={fontSize ? { fontSize } : undefined}
      >
        {content}
      </pre>
    </div>
  );
}

export function GuidelinePanel({
  ccs,
  templateKeys,
  onGuidelineChange,
  onTemplateChange,
  guidelineFontSize,
}: GuidelinePanelProps) {
  const [activeView, setActiveView] = useState<"guide" | "template">("guide");
  const [showSelector, setShowSelector] = useState(false);

  const [guideContent, setGuideContent] = useState<string | null>(null);
  const [guidePdfUrl, setGuidePdfUrl] = useState<string | null>(null);
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);
  const [isGuideLoading, setIsGuideLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const [additionalGuideKeys, setAdditionalGuideKeys] = useState<
    { guideKey: string; displayName: string }[]
  >([]);
  const [recommendedGuideKeys, setRecommendedGuideKeys] = useState<
    { guideKey: string; displayName: string }[]
  >([]);

  const [templateContents, setTemplateContents] = useState<TemplateContent[]>(
    []
  );
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  // 다중 선택 모드
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);

  // C.C. 변경 시 가이드라인 자동 로드 + 뷰 초기화
  const ccsKey = ccs.join("||");
  useEffect(() => {
    if (ccs.length === 0) {
      setGuideContent(null);
      setGuidePdfUrl(null);
      setActiveGuideKey(null);
      setAdditionalGuideKeys([]);
      setRecommendedGuideKeys([]);
      setActiveView("guide");
      setShowSelector(false);
      setMultiSelectMode(false);
      return;
    }

    setActiveView("guide");
    setShowSelector(false);
    setMultiSelectMode(false);
    setIsGuideLoading(true);
    loadGuideline(ccs)
      .then((result) => {
        if (result.mode === "auto") {
          setGuideContent(result.content);
          setGuidePdfUrl(result.pdfSignedUrl);
          setActiveGuideKey(result.guideKey);
          setAdditionalGuideKeys(result.additionalSuggestions);
          setRecommendedGuideKeys([]);
        } else if (result.mode === "recommendations") {
          setGuideContent(null);
          setGuidePdfUrl(null);
          setActiveGuideKey(null);
          setAdditionalGuideKeys([]);
          setRecommendedGuideKeys(result.suggestions);
        } else {
          setGuideContent(null);
          setGuidePdfUrl(null);
          setActiveGuideKey(null);
          setAdditionalGuideKeys([]);
          setRecommendedGuideKeys([]);
        }
      })
      .catch(() => {
        setGuideContent(null);
        setGuidePdfUrl(null);
        setActiveGuideKey(null);
        setAdditionalGuideKeys([]);
        setRecommendedGuideKeys([]);
      })
      .finally(() => setIsGuideLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccsKey]);

  // templateKeys 변경 시 내용 로드
  const templateKeysKey = templateKeys.join("||");
  useEffect(() => {
    if (templateKeys.length === 0) {
      setTemplateContents([]);
      return;
    }
    setIsTemplateLoading(true);
    Promise.all(
      templateKeys.map((key) => loadTemplateContent(key).catch(() => null))
    )
      .then((results) =>
        setTemplateContents(results.filter(Boolean) as TemplateContent[])
      )
      .catch(() => setTemplateContents([]))
      .finally(() => setIsTemplateLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateKeysKey]);

  const closeSelector = () => {
    setShowSelector(false);
    setMultiSelectMode(false);
    setMultiSelected([]);
  };

  const handleGuideTabClick = () => {
    if (activeView === "guide") {
      setShowSelector((v) => !v);
      if (showSelector) setMultiSelectMode(false);
    } else {
      setActiveView("guide");
      closeSelector();
    }
  };

  const handleTemplateTabClick = () => {
    if (activeView === "template") {
      if (showSelector) {
        closeSelector();
      } else {
        setShowSelector(true);
      }
    } else {
      setActiveView("template");
      closeSelector();
    }
  };

  const handleGuidelineSelect = async (guideKey: string) => {
    setLoadingKey(guideKey);
    try {
      const data = await loadGuideByKey(guideKey);
      setGuideContent(data.content);
      setGuidePdfUrl(data.pdfSignedUrl);
      setActiveGuideKey(guideKey);
      onGuidelineChange(guideKey);
      closeSelector();
    } finally {
      setLoadingKey(null);
    }
  };

  // 다중 선택 모드 진입
  const handleMultiSelectToggle = () => {
    if (!multiSelectMode) {
      setMultiSelectMode(true);
      setMultiSelected([...templateKeys]);
    } else {
      setMultiSelectMode(false);
      setMultiSelected([]);
    }
  };

  // 다중 선택 모드에서 항목 클릭
  const handleMultiItemClick = (key: string) => {
    const idx = multiSelected.indexOf(key);
    if (idx >= 0) {
      setMultiSelected((prev) => prev.filter((k) => k !== key));
    } else {
      if (multiSelected.length >= 3) return;
      setMultiSelected((prev) => [...prev, key]);
    }
  };

  // 다중 선택 적용
  const handleMultiApply = () => {
    onTemplateChange(multiSelected);
    closeSelector();
  };

  // 단일 선택 (일반 모드)
  const handleSingleSelect = (key: string | null) => {
    onTemplateChange(key ? [key] : []);
    closeSelector();
  };

  // 상용구 항목 렌더링 (단일/다중 모드 분기)
  const renderTemplateItem = (key: string) => {
    const label = getTemplateLabel(key) ?? key;
    if (multiSelectMode) {
      const selIdx = multiSelected.indexOf(key);
      const isSelected = selIdx >= 0;
      const isDisabled = !isSelected && multiSelected.length >= 3;
      return (
        <button
          key={key}
          type="button"
          disabled={isDisabled}
          onClick={() => handleMultiItemClick(key)}
          className={cn(
            "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
            "disabled:cursor-not-allowed disabled:opacity-40",
            isSelected && "border-primary bg-primary/5"
          )}
        >
          <span>{label}</span>
          {isSelected && (
            <span className="ml-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {selIdx + 1}
            </span>
          )}
        </button>
      );
    }
    return (
      <button
        key={key}
        type="button"
        onClick={() => handleSingleSelect(key)}
        className={cn(
          "w-full rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
          templateKeys.includes(key) && "border-primary bg-primary/5"
        )}
      >
        {label}
      </button>
    );
  };

  const templateSubLabel =
    templateKeys.length > 0
      ? templateKeys
          .map((k) => getTemplateLabel(k))
          .filter(Boolean)
          .join(" / ")
      : null;

  const suggestedTemplateKeys = getSuggestedTemplateKeys(ccs);
  const otherTemplates = templateList.filter(
    (t) => !suggestedTemplateKeys.includes(t.templateKey)
  );

  // 선택기에 표시할 추천 가이드 목록
  const selectorSuggestedGuides = (() => {
    const result: { guideKey: string; displayName: string }[] = [];
    const seen = new Set<string>();
    if (activeGuideKey) {
      result.push({
        guideKey: activeGuideKey,
        displayName: getGuideLabel(activeGuideKey),
      });
      seen.add(activeGuideKey);
    }
    for (const item of [...additionalGuideKeys, ...recommendedGuideKeys]) {
      if (!seen.has(item.guideKey)) {
        result.push(item);
        seen.add(item.guideKey);
      }
    }
    return result;
  })();
  const selectorSuggestedKeys = new Set(
    selectorSuggestedGuides.map((g) => g.guideKey)
  );
  const otherGuides = guideList.filter(
    (g) => !selectorSuggestedKeys.has(g.guideKey)
  );

  const showMultipleContents = templateContents.length > 1;

  const showPdf =
    activeView === "guide" && !showSelector && guidePdfUrl && !isGuideLoading;

  const tabBar = (
    <div className="flex border-b bg-muted/20">
      <TabButton
        icon={<BookOpen className="size-3 shrink-0" />}
        label="가이드라인"
        subLabel={activeGuideKey ? getGuideLabel(activeGuideKey) : undefined}
        active={activeView === "guide"}
        disabled={ccs.length === 0}
        onClick={handleGuideTabClick}
      />
      <div className="w-px shrink-0 self-stretch bg-border" />
      <TabButton
        icon={<FileText className="size-3 shrink-0" />}
        label="상용구"
        subLabel={templateSubLabel}
        active={activeView === "template"}
        disabled={ccs.length === 0}
        onClick={handleTemplateTabClick}
      />
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/30">
      {showPdf ? (
        <div className="flex-1 overflow-y-auto overscroll-y-contain">
          {tabBar}
          <PdfViewer url={guidePdfUrl!} embedded />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overscroll-y-contain">
          {tabBar}
          <div className="p-4">
            {showSelector ? (
              /* 선택 목록 */
              activeView === "guide" ? (
                <div className="flex flex-col gap-1">
                  {selectorSuggestedGuides.length > 0 && (
                    <>
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">
                        추천 가이드라인
                      </p>
                      {selectorSuggestedGuides.map((g) => (
                        <button
                          key={g.guideKey}
                          type="button"
                          disabled={loadingKey === g.guideKey}
                          onClick={() => handleGuidelineSelect(g.guideKey)}
                          className={cn(
                            "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                            "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            activeGuideKey === g.guideKey &&
                              "border-primary bg-primary/5"
                          )}
                        >
                          {loadingKey === g.guideKey
                            ? "불러오는 중..."
                            : g.displayName}
                        </button>
                      ))}
                    </>
                  )}
                  {otherGuides.length > 0 && (
                    <>
                      <p
                        className={cn(
                          "text-xs font-semibold text-muted-foreground",
                          selectorSuggestedGuides.length > 0 && "mt-2"
                        )}
                      >
                        전체 목록
                      </p>
                      {otherGuides.map((g) => (
                        <Fragment key={g.guideKey}>
                          <button
                            type="button"
                            disabled={loadingKey === g.guideKey}
                            onClick={() => handleGuidelineSelect(g.guideKey)}
                            className={cn(
                              "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                              "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                              "disabled:cursor-not-allowed disabled:opacity-50",
                              activeGuideKey === g.guideKey &&
                                "border-primary bg-primary/5"
                            )}
                          >
                            {loadingKey === g.guideKey
                              ? "불러오는 중..."
                              : g.displayName}
                          </button>
                          {g.dividerAfter && (
                            <div className="my-1 h-px bg-border" />
                          )}
                        </Fragment>
                      ))}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={closeSelector}
                    className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    취소
                  </button>
                </div>
              ) : (
                /* 상용구 선택기 */
                <div className="flex flex-col gap-1">
                  {multiSelectMode ? (
                    /* 다중 선택 모드: 상단 고정 취소/확인 행 */
                    <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2">
                      <span className="flex-1 text-xs font-medium text-primary">
                        {multiSelected.length}/3개 선택
                      </span>
                      <button
                        type="button"
                        onClick={closeSelector}
                        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleMultiApply}
                        disabled={multiSelected.length === 0}
                        className={cn(
                          "rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors",
                          "hover:bg-primary/90 active:bg-primary/80",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      >
                        적용 ({multiSelected.length}개)
                      </button>
                    </div>
                  ) : (
                    /* 단일 모드: 다중 상용구 적용 버튼 */
                    <button
                      type="button"
                      onClick={handleMultiSelectToggle}
                      className={cn(
                        "mb-1 flex items-center gap-2 rounded-md border-2 border-dashed px-3 py-2 text-left text-sm font-medium transition-colors",
                        "border-muted-foreground/25 bg-muted/40 text-muted-foreground",
                        "hover:border-muted-foreground/45 hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <Layers className="size-4 shrink-0" />
                      다중 상용구 적용
                    </button>
                  )}

                  {/* 없음 버튼 (단일 모드에서만) */}
                  {!multiSelectMode && (
                    <button
                      type="button"
                      onClick={() => handleSingleSelect(null)}
                      className={cn(
                        "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                        templateKeys.length === 0 &&
                          "border-primary bg-primary/5"
                      )}
                    >
                      없음
                    </button>
                  )}

                  {/* 추천 상용구 */}
                  {suggestedTemplateKeys.length > 0 && (
                    <>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                        추천 상용구
                      </p>
                      {suggestedTemplateKeys.map((key) =>
                        renderTemplateItem(key)
                      )}
                    </>
                  )}

                  {/* 전체 목록 */}
                  {otherTemplates.length > 0 && (
                    <>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                        전체 목록
                      </p>
                      {(() => {
                        const grouped = allCategories
                          .map((cat) => ({
                            label: getCategoryLabel(cat),
                            items: otherTemplates.filter(
                              (t) => t.category === cat
                            ),
                          }))
                          .filter((g) => g.items.length > 0);
                        const uncategorized = otherTemplates.filter(
                          (t) => !t.category
                        );
                        return (
                          <>
                            {grouped.map((group) => (
                              <div key={group.label}>
                                <p className="mt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                  {group.label}
                                </p>
                                {group.items.map((t) =>
                                  renderTemplateItem(t.templateKey)
                                )}
                              </div>
                            ))}
                            {uncategorized.map((t) =>
                              renderTemplateItem(t.templateKey)
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}

                  {/* 단일 모드 취소 */}
                  {!multiSelectMode && (
                    <button
                      type="button"
                      onClick={closeSelector}
                      className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      취소
                    </button>
                  )}
                </div>
              )
            ) : activeView === "guide" ? (
              /* 가이드라인 뷰 */
              ccs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  C.C.를 입력하면 해당 증상에 맞는 문진 가이드라인이 표시됩니다.
                </p>
              ) : isGuideLoading ? (
                <p className="text-sm text-muted-foreground">
                  가이드라인 불러오는 중...
                </p>
              ) : guideContent ? (
                guideContent.trimStart().startsWith("<") ? (
                  <HtmlPreview
                    content={guideContent}
                    zoom={
                      guidelineFontSize !== undefined
                        ? guidelineFontSize / 12.5
                        : undefined
                    }
                  />
                ) : (
                  <MarkdownPreview content={guideContent} />
                )
              ) : recommendedGuideKeys.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    관련 가이드라인
                  </p>
                  {recommendedGuideKeys.map((g) => (
                    <button
                      key={g.guideKey}
                      type="button"
                      disabled={loadingKey === g.guideKey}
                      onClick={() => handleGuidelineSelect(g.guideKey)}
                      className={cn(
                        "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      {loadingKey === g.guideKey
                        ? "불러오는 중..."
                        : g.displayName}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  해당 C.C.에 대한 가이드라인이 없습니다. 위 탭을 클릭해 직접
                  선택하세요.
                </p>
              )
            ) : /* 상용구 뷰 */
            ccs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                C.C.를 입력하면 상용구를 선택할 수 있습니다.
              </p>
            ) : isTemplateLoading ? (
              <p className="text-sm text-muted-foreground">
                상용구 불러오는 중...
              </p>
            ) : templateContents.length > 0 ? (
              <div className="space-y-4">
                {/* P.I. 상용구 섹션 — 1,2,3 순서 */}
                {templateContents.map((tc, i) => (
                  <TemplateSectionBlock
                    key={`pi-${i}`}
                    title={
                      showMultipleContents
                        ? `P.I. 상용구 ${CIRCLED[i]}`
                        : "P.I. 상용구"
                    }
                    subtitle={
                      showMultipleContents
                        ? (getTemplateLabel(templateKeys[i]) ?? undefined)
                        : undefined
                    }
                    content={tc.mainExample}
                    fontSize={guidelineFontSize}
                  />
                ))}
                {/* History 섹션 — 1,2,3 순서 */}
                {templateContents.map((tc, i) => (
                  <TemplateSectionBlock
                    key={`hist-${i}`}
                    title={
                      showMultipleContents ? `History ${CIRCLED[i]}` : "History"
                    }
                    subtitle={
                      showMultipleContents
                        ? (getTemplateLabel(templateKeys[i]) ?? undefined)
                        : undefined
                    }
                    content={tc.historyExample}
                    fontSize={guidelineFontSize}
                  />
                ))}
                {/* P/E 섹션 — 1,2,3 순서 */}
                {templateContents.map((tc, i) => (
                  <TemplateSectionBlock
                    key={`pe-${i}`}
                    title={showMultipleContents ? `P/E ${CIRCLED[i]}` : "P/E"}
                    subtitle={
                      showMultipleContents
                        ? (getTemplateLabel(templateKeys[i]) ?? undefined)
                        : undefined
                    }
                    content={tc.peExample}
                    fontSize={guidelineFontSize}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {templateKeys.length > 0
                  ? "상용구 내용을 불러올 수 없습니다."
                  : "위 탭을 클릭해 상용구를 선택하세요."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
