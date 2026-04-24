"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemplateItem } from "@/lib/admin/resource-reader";

type ParsedExample = {
  number: string;
  hpi: string;
  piTemplate: string;
  history: string;
  pe: string;
};

function parseExamples(content: string): ParsedExample[] {
  const caseHeaderRegex = /^### (\d+)\./gm;
  const parts = content.split(caseHeaderRegex);
  const examples: ParsedExample[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    const number = parts[i].padStart(3, "0");
    const body = parts[i + 1] ?? "";
    const codeBlocks = [...body.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(
      (m) => m[1].trim()
    );
    examples.push({
      number,
      hpi: codeBlocks[0] ?? "",
      piTemplate: codeBlocks[1] ?? "",
      history: codeBlocks[2] ?? "",
      pe: codeBlocks[3] ?? "",
    });
  }
  return examples;
}

function SectionBlock({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded border bg-muted/50 p-2.5 font-mono text-xs leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

function ExamplesViewer({ content }: { content: string }) {
  const examples = parseExamples(content);
  const [selected, setSelected] = useState(0);

  if (examples.length === 0) return null;

  const current = examples[selected];

  return (
    <div className="space-y-3">
      {/* 케이스 선택 버튼 */}
      <div className="flex flex-wrap gap-1">
        {examples.map((ex, idx) => (
          <button
            key={ex.number}
            type="button"
            onClick={() => setSelected(idx)}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              selected === idx
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {ex.number}
          </button>
        ))}
      </div>

      {/* 선택된 케이스 내용 */}
      {current && (
        <div className="space-y-3 rounded-md border p-3">
          <SectionBlock label="HPI" text={current.hpi} />
          <SectionBlock label="P.I template" text={current.piTemplate} />
          <SectionBlock label="History" text={current.history} />
          <SectionBlock label="P/E" text={current.pe} />
        </div>
      )}
    </div>
  );
}

interface TemplateDetailProps {
  item: TemplateItem;
}

function OutputPreview({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium">{label}</p>
      <pre className="overflow-x-auto rounded border bg-muted/50 p-2 text-xs leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

export function TemplateDetail({ item }: TemplateDetailProps) {
  const [examplesOpen, setExamplesOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{item.displayName}</h2>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {item.key}
          </code>
          {item.exists ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
          ) : (
            <XCircle className="size-4 text-destructive" />
          )}
          {item.category && (
            <Badge variant="secondary" className="text-xs">
              {item.category.replace(/^\d+\.\s*/, "")}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">연결된 C.C.</span>
          {item.linkedCcs.length === 0 ? (
            <span className="text-xs text-muted-foreground">없음</span>
          ) : (
            item.linkedCcs.map((cc) => (
              <Badge key={cc} variant="secondary" className="text-xs">
                {cc}
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="border-t" />

      {/* 상용구 출력 예시 */}
      {item.exists ? (
        <Card className="overflow-hidden">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm">
              <code className="font-mono text-xs text-muted-foreground">
                ai-docs/templates/{item.key}/template.json
              </code>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4 pb-4">
            <OutputPreview
              label={`P.I 상용구 (fields)`}
              text={item.mainOutputExample}
            />
            <OutputPreview
              label={`History (${item.historyFieldCount}개 항목)`}
              text={item.historyOutputExample}
            />
            <OutputPreview
              label={`P/E (${item.peFieldCount}개 항목)`}
              text={item.peOutputExample}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          <span>
            <code className="text-xs">
              ai-docs/templates/{item.key}/template.json
            </code>{" "}
            파일을 찾을 수 없습니다.
          </span>
        </div>
      )}

      <div className="border-t" />

      {/* 차팅 예시 섹션 */}
      <div className="space-y-2">
        {item.examplesExists ? (
          <>
            <button
              type="button"
              onClick={() => setExamplesOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent/50"
            >
              <span>
                차팅 예시{" "}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({item.exampleCount}개)
                </span>
              </span>
              {examplesOpen ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            {examplesOpen && <ExamplesViewer content={item.examplesContent} />}
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2">
            <XCircle className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              차팅 예시가 없습니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
