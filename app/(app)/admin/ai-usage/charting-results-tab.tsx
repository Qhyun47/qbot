"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getTemplateCompletedSummary,
  getTemplateCases,
} from "@/lib/admin/ai-usage-queries";
import type {
  TemplateUsageEntry,
  TemplateCaseSummary,
} from "@/lib/admin/ai-usage-queries";
import { CaseDetailPanel } from "./case-detail-panel";
import categoriesRaw from "@/lib/ai/resources/template-categories.json";

const allCategories = categoriesRaw as string[];

function getCategoryLabel(cat: string): string {
  return cat.replace(/^\d+\.\s*/, "");
}

function groupTemplates(
  templates: TemplateUsageEntry[]
): { label: string; items: TemplateUsageEntry[] }[] {
  const groups = allCategories
    .map((cat) => ({
      label: getCategoryLabel(cat),
      items: templates.filter((t) => t.category === cat),
    }))
    .filter((g) => g.items.length > 0);
  const uncategorized = templates.filter((t) => !t.category);
  if (uncategorized.length > 0) {
    groups.push({ label: "기타", items: uncategorized });
  }
  return groups;
}

function getDateRange(preset: "7d" | "30d" | "all"): {
  from: string;
  to: string;
} {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  if (preset === "7d") {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (preset === "30d") {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  return { from: "2020-01-01T00:00:00.000Z", to: to.toISOString() };
}

function CaseRow({ c }: { c: TemplateCaseSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <User className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium">
            {c.ccs?.join(", ") ?? c.cc ?? "(C.C. 없음)"}
          </span>
          <span className="text-sm text-muted-foreground">
            {" / "}
            {c.user_name ?? "(이름 없음)"}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(c.created_at).toLocaleString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </button>
      {open && <CaseDetailPanel caseId={c.id} />}
    </div>
  );
}

export function ChartingResultsTab() {
  const [preset, setPreset] = useState<"7d" | "30d" | "all">("30d");
  const [templates, setTemplates] = useState<TemplateUsageEntry[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [cases, setCases] = useState<TemplateCaseSummary[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  const loadTemplates = useCallback((p: "7d" | "30d" | "all") => {
    setLoadingTemplates(true);
    setSelectedKey(null);
    setCases([]);
    const { from, to } = getDateRange(p);
    getTemplateCompletedSummary(from, to).then((t) => {
      setTemplates(t);
      setLoadingTemplates(false);
    });
  }, []);

  useEffect(() => {
    loadTemplates(preset);
  }, [loadTemplates, preset]);

  function handleSelectTemplate(key: string) {
    if (selectedKey === key) return;
    setSelectedKey(key);
    setLoadingCases(true);
    const { from, to } = getDateRange(preset);
    getTemplateCases(key, from, to).then((c) => {
      setCases(c);
      setLoadingCases(false);
    });
  }

  const selectedEntry = templates.find((t) => t.templateKey === selectedKey);
  const templateGroups = groupTemplates(templates);

  return (
    <div className="flex h-full overflow-hidden">
      {/* 좌측 패널 */}
      <div className="flex w-52 shrink-0 flex-col overflow-hidden border-r">
        {/* 날짜 필터 */}
        <div className="flex gap-1 border-b px-3 py-2">
          {(["7d", "30d", "all"] as const).map((p) => (
            <Button
              key={p}
              variant={preset === p ? "secondary" : "ghost"}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => setPreset(p)}
            >
              {p === "7d" ? "7일" : p === "30d" ? "30일" : "전체"}
            </Button>
          ))}
        </div>

        {/* 상용구 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : templateGroups.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              해당 기간에 완료된 케이스가 없습니다.
            </p>
          ) : (
            templateGroups.map((group) => (
              <div key={group.label}>
                <p className="sticky top-0 bg-background/95 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
                {group.items.map((t) => (
                  <button
                    key={t.templateKey}
                    onClick={() => handleSelectTemplate(t.templateKey)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                      selectedKey === t.templateKey
                        ? "bg-muted font-medium"
                        : "font-normal"
                    )}
                  >
                    <span className="min-w-0 truncate text-sm">
                      {t.displayName}
                    </span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {t.count}건
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 우측 패널 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!selectedKey ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            좌측에서 상용구를 선택하세요.
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 border-b px-4 py-3">
              <h2 className="text-sm font-semibold">
                {selectedEntry?.displayName}
              </h2>
              {!loadingCases && (
                <span className="text-xs text-muted-foreground">
                  {cases.length}건
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingCases ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm">불러오는 중...</span>
                </div>
              ) : cases.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  케이스가 없습니다.
                </p>
              ) : (
                cases.map((c) => <CaseRow key={c.id} c={c} />)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
