"use client";

import { useEffect, useRef, useState } from "react";
import { CheckSquare, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ccListRaw from "@/lib/ai/resources/cc-list.json";
import type {
  CcListEntry,
  CcConnectionEntry,
} from "@/lib/ai/resources/cc-types";
import { resolveEntries } from "@/lib/ai/resources/cc-types";

const ccList = ccListRaw as CcListEntry[];

function resolveTemplateEntries(item: CcListEntry): CcConnectionEntry[] {
  return resolveEntries(item, "templateKeys", ccList);
}

function matchesPattern(input: string, patternCc: string): boolean {
  const q = input.toLowerCase();
  if (patternCc.endsWith(" **")) {
    const prefix = patternCc.slice(0, -3).toLowerCase();
    return q.startsWith(prefix + " ") && q.length > prefix.length + 1;
  }
  if (patternCc.startsWith("** ")) {
    const suffix = patternCc.slice(3).toLowerCase();
    return q.endsWith(" " + suffix) && q.length > suffix.length + 1;
  }
  return false;
}

interface MultiCcInputProps {
  values: string[];
  onChange: (ccs: string[], lastTemplateEntries: CcConnectionEntry[]) => void;
}

export function MultiCcInput({ values, onChange }: MultiCcInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered: (CcListEntry & { displayCc?: string })[] = inputValue
    ? (() => {
        const q = inputValue.toLowerCase();
        const exact = ccList
          .filter(
            (item) =>
              !item.cc.includes("**") && item.cc.toLowerCase().includes(q)
          )
          .sort((a, b) => {
            const aStarts = a.cc.toLowerCase().startsWith(q);
            const bStarts = b.cc.toLowerCase().startsWith(q);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.cc.localeCompare(b.cc);
          });

        const patternMatches = ccList
          .filter(
            (item) =>
              item.cc.includes("**") && matchesPattern(inputValue, item.cc)
          )
          .map((item) => ({ ...item, displayCc: inputValue }));

        return [...exact, ...patternMatches].slice(0, 8);
      })()
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleAdd(ccStr: string, templateEntries: CcConnectionEntry[]) {
    const trimmed = ccStr.trim();
    if (!trimmed) return;
    onChange([...values, trimmed], templateEntries);
    setInputValue("");
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function handleRemove(cc: string) {
    onChange(
      values.filter((v) => v !== cc),
      []
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      if (open && filtered.length > 0 && highlightedIndex >= 0) {
        e.preventDefault();
        const item = filtered[highlightedIndex];
        const selectedCc = item.displayCc ?? item.cc;
        handleAdd(selectedCc, resolveTemplateEntries(item));
      } else if (inputValue.trim()) {
        e.preventDefault();
        handleAdd(inputValue, []);
      }
      return;
    }
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {values.map((cc) => (
        <div
          key={cc}
          className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm"
        >
          <span>{cc}</span>
          <button
            type="button"
            onClick={() => handleRemove(cc)}
            className="ml-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      <div className="relative">
        <div className="flex gap-1.5">
          <Input
            value={inputValue}
            placeholder="예: Chest pain, Dyspnea..."
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              if (inputValue) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="h-9 flex-1"
          />
          <button
            type="button"
            onClick={() => handleAdd(inputValue, [])}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background hover:bg-accent"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-white shadow-md dark:bg-zinc-900">
            {filtered.map((item, idx) => (
              <button
                key={`${item.cc}__${item.displayCc ?? ""}`}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between bg-white px-3 py-2.5 text-sm transition-colors dark:bg-zinc-900",
                  idx === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60"
                )}
                onClick={() => {
                  const selectedCc = item.displayCc ?? item.cc;
                  handleAdd(selectedCc, resolveTemplateEntries(item));
                }}
              >
                <span>{item.displayCc ?? item.cc}</span>
                {resolveTemplateEntries(item).length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckSquare className="size-3 text-emerald-600" />
                    상용구 있음
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
