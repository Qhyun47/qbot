"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CcResourceDetail } from "@/components/admin/cc-resource-detail";
import { GuideDetail } from "@/components/admin/guide-detail";
import { TemplateDetail } from "@/components/admin/template-detail";
import type {
  ResourceOverviewData,
  CcResourceItem,
} from "@/lib/admin/resource-reader";

type FilterType = "all" | "guide" | "template";

interface ResourceOverviewProps {
  data: ResourceOverviewData;
}

function CcSidebarItem({
  item,
  selected,
  onClick,
}: {
  item: CcResourceItem;
  selected: boolean;
  onClick: () => void;
}) {
  const hasGuide = item.guides.some((g) => g.exists);
  const hasTemplate = item.templates.some((t) => t.exists);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left transition-colors",
        selected
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-accent/50"
      )}
    >
      <span className="text-sm leading-tight">{item.cc}</span>
      <div className="mt-1 flex flex-wrap gap-1">
        {hasGuide ? (
          <Badge className="h-4 bg-emerald-100 px-1.5 text-[10px] text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
            가이드
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[10px] text-muted-foreground"
          >
            가이드 없음
          </Badge>
        )}
        {hasTemplate ? (
          <Badge className="h-4 bg-blue-100 px-1.5 text-[10px] text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300">
            상용구
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[10px] text-muted-foreground"
          >
            상용구 없음
          </Badge>
        )}
      </div>
    </button>
  );
}

function ResourceSidebarItem({
  displayName,
  linkedCount,
  selected,
  onClick,
}: {
  displayName: string;
  linkedCount: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2.5 text-left transition-colors",
        selected
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-accent/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{displayName}</span>
        {linkedCount > 0 && (
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            C.C. {linkedCount}
          </Badge>
        )}
      </div>
    </button>
  );
}

export function ResourceOverview({ data }: ResourceOverviewProps) {
  const { stats } = data;
  const [filter, setFilter] = useState<FilterType>("all");

  const topLevelItems = data.items.filter((i) => !i.aliasOf);

  // C.C 탭 선택 상태
  const [selectedCc, setSelectedCc] = useState(topLevelItems[0]?.cc ?? "");
  // 가이드라인 탭 선택 상태
  const [selectedGuide, setSelectedGuide] = useState(
    data.guideItems[0]?.key ?? ""
  );
  // 상용구 탭 선택 상태
  const [selectedTemplate, setSelectedTemplate] = useState(
    data.templateItems[0]?.key ?? ""
  );

  const selectedCcItem = topLevelItems.find((i) => i.cc === selectedCc);
  const selectedGuideItem = data.guideItems.find(
    (i) => i.key === selectedGuide
  );
  const selectedTemplateItem = data.templateItems.find(
    (i) => i.key === selectedTemplate
  );

  function handleFilterChange(next: FilterType) {
    setFilter(next);
  }

  // 현재 필터에 따른 사이드바/상세 렌더링 정보
  const sidebarItems: {
    id: string;
    displayName: string;
    linkedCount: number;
  }[] =
    filter === "guide"
      ? data.guideItems.map((g) => ({
          id: g.key,
          displayName: g.displayName,
          linkedCount: g.linkedCcs.length,
        }))
      : filter === "template"
        ? data.templateItems.map((t) => ({
            id: t.key,
            displayName: t.displayName,
            linkedCount: t.linkedCcs.length,
          }))
        : [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 탭 버튼 영역 */}
      <div className="shrink-0 border-b px-4">
        <div className="flex gap-0">
          {(
            [
              { key: "all", label: "C.C", count: stats.totalCc },
              { key: "guide", label: "가이드라인", count: stats.withGuide },
              { key: "template", label: "상용구", count: stats.withTemplate },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleFilterChange(key)}
              className={cn(
                "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                filter === key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}{" "}
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  filter === key
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 모바일: Select 드롭다운 */}
        <div className="border-b px-3 py-2 md:hidden">
          {filter === "all" && (
            <Select value={selectedCc} onValueChange={setSelectedCc}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="C.C. 선택..." />
              </SelectTrigger>
              <SelectContent>
                {topLevelItems.map((item) => (
                  <SelectItem key={item.cc} value={item.cc} className="text-sm">
                    {item.cc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filter === "guide" && (
            <Select value={selectedGuide} onValueChange={setSelectedGuide}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="가이드 선택..." />
              </SelectTrigger>
              <SelectContent>
                {data.guideItems.map((g) => (
                  <SelectItem key={g.key} value={g.key} className="text-sm">
                    {g.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filter === "template" && (
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="상용구 선택..." />
              </SelectTrigger>
              <SelectContent>
                {data.templateItems.map((t) => (
                  <SelectItem key={t.key} value={t.key} className="text-sm">
                    {t.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 데스크탑: 좌측 사이드바 */}
        <div className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r md:flex">
          {filter === "all" &&
            topLevelItems.map((item) => (
              <CcSidebarItem
                key={item.cc}
                item={item}
                selected={selectedCc === item.cc}
                onClick={() => setSelectedCc(item.cc)}
              />
            ))}
          {filter !== "all" &&
            (sidebarItems.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground">
                등록된 항목이 없습니다.
              </p>
            ) : (
              sidebarItems.map(({ id, displayName, linkedCount }) => (
                <ResourceSidebarItem
                  key={id}
                  displayName={displayName}
                  linkedCount={linkedCount}
                  selected={
                    filter === "guide"
                      ? selectedGuide === id
                      : selectedTemplate === id
                  }
                  onClick={() =>
                    filter === "guide"
                      ? setSelectedGuide(id)
                      : setSelectedTemplate(id)
                  }
                />
              ))
            ))}
        </div>

        {/* 우측 상세 패널 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filter === "all" && selectedCcItem && (
            <CcResourceDetail item={selectedCcItem} />
          )}
          {filter === "guide" &&
            (selectedGuideItem ? (
              <GuideDetail item={selectedGuideItem} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                좌측에서 가이드라인을 선택하세요.
              </div>
            ))}
          {filter === "template" &&
            (selectedTemplateItem ? (
              <TemplateDetail item={selectedTemplateItem} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                좌측에서 상용구를 선택하세요.
              </div>
            ))}
          {filter === "all" && !selectedCcItem && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              좌측에서 C.C.를 선택하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
