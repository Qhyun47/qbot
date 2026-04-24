"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText } from "lucide-react";
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

interface CcListEntry {
  cc: string;
  guideKeys: string[];
  templateKeys: string[];
  aliasOf?: string;
}

interface TemplateListEntry {
  templateKey: string;
  displayName: string;
  category?: string;
}

interface GuideListEntry {
  guideKey: string;
  displayName: string;
}

const ccList = ccListRaw as CcListEntry[];
const templateList = templateListRaw as TemplateListEntry[];
const guideList = guideListRaw as GuideListEntry[];
const allCategories = categoriesRaw as string[];

function getCategoryLabel(category: string): string {
  return category.replace(/^\d+\.\s*/, "");
}

interface GuidelinePanelProps {
  cc: string | null;
  templateKey: string | null;
  onGuidelineChange: (guideKey: string) => void;
  onTemplateChange: (templateKey: string | null) => void;
  guidelineFontSize?: number;
}

function getSuggestedGuideKeys(cc: string | null): string[] {
  if (!cc) return [];
  const item = ccList.find((i) => i.cc.toLowerCase() === cc.toLowerCase());
  if (!item) return [];
  if (item.aliasOf) {
    const parent = ccList.find((i) => i.cc === item.aliasOf);
    return parent?.guideKeys ?? [];
  }
  return item.guideKeys;
}

function getGuideLabel(guideKey: string): string {
  return (
    guideList.find((g) => g.guideKey === guideKey)?.displayName ?? guideKey
  );
}

function getTemplateLabel(key: string | null): string | null {
  if (!key) return null;
  return templateList.find((t) => t.templateKey === key)?.displayName ?? key;
}

function getSuggestedTemplateKeys(cc: string | null): string[] {
  if (!cc) return [];
  const item = ccList.find((i) => i.cc.toLowerCase() === cc.toLowerCase());
  if (!item) return [];
  if (item.aliasOf) {
    const parent = ccList.find((i) => i.cc === item.aliasOf);
    return parent?.templateKeys ?? [];
  }
  return item.templateKeys;
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
  content,
  fontSize,
}: {
  title: string;
  content: string;
  fontSize?: number;
}) {
  if (!content) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
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
  cc,
  templateKey,
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

  const [templateContent, setTemplateContent] =
    useState<TemplateContent | null>(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  // C.C. 변경 시 가이드라인 자동 로드 + 뷰 초기화
  useEffect(() => {
    if (!cc) {
      setGuideContent(null);
      setGuidePdfUrl(null);
      setActiveGuideKey(null);
      setActiveView("guide");
      setShowSelector(false);
      return;
    }

    setActiveView("guide");
    setShowSelector(false);
    setIsGuideLoading(true);
    loadGuideline(cc)
      .then((result) => {
        if (result.mode === "auto") {
          setGuideContent(result.content);
          setGuidePdfUrl(result.pdfSignedUrl);
          setActiveGuideKey(result.guideKey);
        } else {
          setGuideContent(null);
          setGuidePdfUrl(null);
          setActiveGuideKey(null);
        }
      })
      .catch(() => {
        setGuideContent(null);
        setGuidePdfUrl(null);
        setActiveGuideKey(null);
      })
      .finally(() => setIsGuideLoading(false));
  }, [cc]);

  // 상용구 키 변경 시 내용 미리 로드
  useEffect(() => {
    if (!templateKey) {
      setTemplateContent(null);
      return;
    }
    setIsTemplateLoading(true);
    loadTemplateContent(templateKey)
      .then(setTemplateContent)
      .catch(() => setTemplateContent(null))
      .finally(() => setIsTemplateLoading(false));
  }, [templateKey]);

  const handleGuideTabClick = () => {
    if (activeView === "guide") {
      setShowSelector((v) => !v);
    } else {
      setActiveView("guide");
      setShowSelector(false);
    }
  };

  const handleTemplateTabClick = () => {
    if (activeView === "template") {
      setShowSelector((v) => !v);
    } else {
      setActiveView("template");
      setShowSelector(false);
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
      setShowSelector(false);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleTemplateSelect = (key: string | null) => {
    onTemplateChange(key);
    setShowSelector(false);
  };

  const templateLabel = getTemplateLabel(templateKey);
  const suggestedGuideKeys = getSuggestedGuideKeys(cc);
  const otherGuides = guideList.filter(
    (g) => !suggestedGuideKeys.includes(g.guideKey)
  );
  const suggestedTemplateKeys = getSuggestedTemplateKeys(cc);
  const otherTemplates = templateList.filter(
    (t) => !suggestedTemplateKeys.includes(t.templateKey)
  );

  const showPdf =
    activeView === "guide" && !showSelector && guidePdfUrl && !isGuideLoading;

  const tabBar = (
    <div className="flex border-b bg-muted/20">
      <TabButton
        icon={<BookOpen className="size-3 shrink-0" />}
        label="가이드라인"
        subLabel={activeGuideKey ? getGuideLabel(activeGuideKey) : undefined}
        active={activeView === "guide"}
        disabled={!cc}
        onClick={handleGuideTabClick}
      />
      <div className="w-px shrink-0 self-stretch bg-border" />
      <TabButton
        icon={<FileText className="size-3 shrink-0" />}
        label="상용구"
        subLabel={templateLabel}
        active={activeView === "template"}
        disabled={!cc}
        onClick={handleTemplateTabClick}
      />
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/30">
      {/* 콘텐츠 영역 */}
      {showPdf ? (
        // PDF 모드: HTML 모드와 동일하게 단일 스크롤 컨테이너 사용
        // → 탭바·줌 버튼이 스크롤 시 함께 올라감
        <div className="flex-1 overflow-y-auto overscroll-y-contain">
          {tabBar}
          <PdfViewer url={guidePdfUrl!} embedded />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overscroll-y-contain">
          {/* 탭 바: 스크롤과 함께 이동 */}
          {tabBar}
          <div className="p-4">
            {showSelector ? (
              /* 선택 목록 */
              activeView === "guide" ? (
                <div className="flex flex-col gap-1">
                  {suggestedGuideKeys.length > 0 && (
                    <>
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">
                        추천 가이드라인
                      </p>
                      {suggestedGuideKeys.map((key) => (
                        <button
                          key={key}
                          type="button"
                          disabled={loadingKey === key}
                          onClick={() => handleGuidelineSelect(key)}
                          className={cn(
                            "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                            "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            activeGuideKey === key &&
                              "border-primary bg-primary/5"
                          )}
                        >
                          {loadingKey === key
                            ? "불러오는 중..."
                            : getGuideLabel(key)}
                        </button>
                      ))}
                    </>
                  )}
                  {otherGuides.length > 0 && (
                    <>
                      <p
                        className={cn(
                          "text-xs font-semibold text-muted-foreground",
                          suggestedGuideKeys.length > 0 && "mt-2"
                        )}
                      >
                        전체 목록
                      </p>
                      {otherGuides.map((g) => (
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
                  <button
                    type="button"
                    onClick={() => setShowSelector(false)}
                    className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect(null)}
                    className={cn(
                      "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                      templateKey === null && "border-primary bg-primary/5"
                    )}
                  >
                    없음
                  </button>
                  {suggestedTemplateKeys.length > 0 && (
                    <>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                        추천 상용구
                      </p>
                      {suggestedTemplateKeys.map((key) => {
                        const label = getTemplateLabel(key) ?? key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleTemplateSelect(key)}
                            className={cn(
                              "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                              "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                              templateKey === key &&
                                "border-primary bg-primary/5"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </>
                  )}
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
                                {group.items.map((t) => (
                                  <button
                                    key={t.templateKey}
                                    type="button"
                                    onClick={() =>
                                      handleTemplateSelect(t.templateKey)
                                    }
                                    className={cn(
                                      "w-full rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                                      "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                                      templateKey === t.templateKey &&
                                        "border-primary bg-primary/5"
                                    )}
                                  >
                                    {t.displayName}
                                  </button>
                                ))}
                              </div>
                            ))}
                            {uncategorized.map((t) => (
                              <button
                                key={t.templateKey}
                                type="button"
                                onClick={() =>
                                  handleTemplateSelect(t.templateKey)
                                }
                                className={cn(
                                  "w-full rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                                  "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                                  templateKey === t.templateKey &&
                                    "border-primary bg-primary/5"
                                )}
                              >
                                {t.displayName}
                              </button>
                            ))}
                          </>
                        );
                      })()}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSelector(false)}
                    className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    취소
                  </button>
                </div>
              )
            ) : activeView === "guide" ? (
              /* 가이드라인 뷰 */
              !cc ? (
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  해당 C.C.에 대한 가이드라인이 없습니다. 위 탭을 클릭해 직접
                  선택하세요.
                </p>
              )
            ) : /* 상용구 뷰 */
            !cc ? (
              <p className="text-sm text-muted-foreground">
                C.C.를 입력하면 상용구를 선택할 수 있습니다.
              </p>
            ) : isTemplateLoading ? (
              <p className="text-sm text-muted-foreground">
                상용구 불러오는 중...
              </p>
            ) : templateContent ? (
              <div className="space-y-4">
                <TemplateSectionBlock
                  title="P.I. 상용구"
                  content={templateContent.mainExample}
                  fontSize={guidelineFontSize}
                />
                <TemplateSectionBlock
                  title="History"
                  content={templateContent.historyExample}
                  fontSize={guidelineFontSize}
                />
                <TemplateSectionBlock
                  title="P/E"
                  content={templateContent.peExample}
                  fontSize={guidelineFontSize}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {templateKey
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
