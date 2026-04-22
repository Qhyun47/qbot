"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronsUpDown, FileText } from "lucide-react";
import { loadGuideline } from "@/lib/guidelines/actions";
import { cn } from "@/lib/utils";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import ccListRaw from "@/lib/ai/resources/cc-list.json";
import templateListRaw from "@/lib/ai/resources/template-list.json";

interface CcListEntry {
  cc: string;
  guideKeys: string[];
  templateKeys: string[];
  aliasOf?: string;
}

interface TemplateListEntry {
  templateKey: string;
  displayName: string;
}

const ccList = ccListRaw as CcListEntry[];
const templateList = templateListRaw as TemplateListEntry[];

interface GuidelinePanelProps {
  content: string | null;
  cc: string | null;
  templateKey: string | null;
  onGuidelineChange: (cc: string) => void;
  onTemplateChange: (templateKey: string | null) => void;
}

// 가이드라인 선택 목록: alias 제외한 고유 CC 목록
const GUIDE_OPTIONS = ccList.filter((item) => !item.aliasOf);

// templateKey → 표시 이름 (template-list.json 기준)
function getTemplateLabel(key: string | null): string | null {
  if (!key) return null;
  return templateList.find((t) => t.templateKey === key)?.displayName ?? key;
}

// 현재 CC의 추천 templateKey 목록
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

const CHIP_CLASS = cn(
  "flex w-full items-center gap-1.5 px-4 py-3",
  "border-b bg-muted/20",
  "cursor-pointer select-none text-left",
  "text-xs font-semibold uppercase tracking-wider",
  "transition-colors",
  "hover:bg-muted/50 active:bg-muted/60",
  "disabled:cursor-default disabled:opacity-40"
);

export function GuidelinePanel({
  content,
  cc,
  templateKey,
  onGuidelineChange,
  onTemplateChange,
}: GuidelinePanelProps) {
  const [showGuideSelector, setShowGuideSelector] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [manualContent, setManualContent] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    setManualContent(null);
    setShowGuideSelector(false);
    setShowTemplateSelector(false);
  }, [cc]);

  const handleGuidelineSelect = async (guidelineCc: string) => {
    setLoadingKey(guidelineCc);
    try {
      const { customContent, systemContent } = await loadGuideline(guidelineCc);
      setManualContent(customContent ?? systemContent);
      onGuidelineChange(guidelineCc);
      setShowGuideSelector(false);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleTemplateSelect = (key: string | null) => {
    onTemplateChange(key);
    setShowTemplateSelector(false);
  };

  const displayContent = manualContent ?? content;
  const templateLabel = getTemplateLabel(templateKey);
  const suggestedKeys = getSuggestedTemplateKeys(cc);
  const otherTemplates = templateList.filter(
    (t) => !suggestedKeys.includes(t.templateKey)
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-muted/30">
      {/* 가이드라인 chip */}
      <button
        type="button"
        disabled={!cc}
        onClick={() => {
          setShowTemplateSelector(false);
          setShowGuideSelector((v) => !v);
        }}
        className={CHIP_CLASS}
      >
        <BookOpen className="size-3 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">문진 가이드라인</span>
        {cc && (
          <span className="font-normal normal-case text-foreground">
            — {cc}
          </span>
        )}
        <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {/* 상용구 chip */}
      <button
        type="button"
        disabled={!cc}
        onClick={() => {
          setShowGuideSelector(false);
          setShowTemplateSelector((v) => !v);
        }}
        className={CHIP_CLASS}
      >
        <FileText className="size-3 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">상용구</span>
        {templateLabel ? (
          <span className="font-normal normal-case text-foreground">
            — {templateLabel}
          </span>
        ) : cc ? (
          <span className="font-normal normal-case text-muted-foreground/70">
            — 선택 안 됨
          </span>
        ) : null}
        <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {/* 콘텐츠 영역 */}
      <div className="p-4">
        {showGuideSelector ? (
          <div className="flex flex-col gap-1">
            <p className="mb-2 text-xs text-muted-foreground">
              가이드라인을 선택하세요
            </p>
            {GUIDE_OPTIONS.map((item) => (
              <button
                key={item.cc}
                type="button"
                disabled={loadingKey === item.cc}
                onClick={() => handleGuidelineSelect(item.cc)}
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {loadingKey === item.cc ? "불러오는 중..." : item.cc}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowGuideSelector(false)}
              className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              취소
            </button>
          </div>
        ) : showTemplateSelector ? (
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
            {suggestedKeys.length > 0 && (
              <>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  추천 상용구
                </p>
                {suggestedKeys.map((key) => {
                  const label = getTemplateLabel(key) ?? key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTemplateSelect(key)}
                      className={cn(
                        "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                        templateKey === key && "border-primary bg-primary/5"
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
                {otherTemplates.map((t) => (
                  <button
                    key={t.templateKey}
                    type="button"
                    onClick={() => handleTemplateSelect(t.templateKey)}
                    className={cn(
                      "rounded-md border bg-background px-3 py-2 text-left text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                      templateKey === t.templateKey &&
                        "border-primary bg-primary/5"
                    )}
                  >
                    {t.displayName}
                  </button>
                ))}
              </>
            )}
            <button
              type="button"
              onClick={() => setShowTemplateSelector(false)}
              className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              취소
            </button>
          </div>
        ) : !cc ? (
          <p className="text-sm text-muted-foreground">
            C.C.를 입력하면 해당 증상에 맞는 문진 가이드라인이 표시됩니다.
          </p>
        ) : displayContent ? (
          <MarkdownPreview content={displayContent} />
        ) : (
          <p className="text-sm text-muted-foreground">
            해당 C.C.에 대한 가이드라인이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
