"use client";

import { useEffect, useRef, useState } from "react";
import { CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ccListRaw from "@/lib/ai/resources/cc-list.json";

const ccList = ccListRaw as CcListEntry[];

interface CcListEntry {
  cc: string;
  guideKeys: string[];
  templateKeys: string[];
  aliasOf?: string;
}

function resolveTemplateKeys(item: CcListEntry): string[] {
  if (!item.aliasOf) return item.templateKeys;
  const parent = ccList.find((i) => i.cc === item.aliasOf);
  return parent?.templateKeys ?? item.templateKeys;
}

interface CcAutocompleteProps {
  value: string;
  onSelect: (cc: string, hasTemplate: boolean, templateKeys: string[]) => void;
}

export function CcAutocomplete({ value, onSelect }: CcAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = inputValue
    ? ccList
        .filter((item) =>
          item.cc.toLowerCase().includes(inputValue.toLowerCase())
        )
        .sort((a, b) => {
          const q = inputValue.toLowerCase();
          const aStarts = a.cc.toLowerCase().startsWith(q);
          const bStarts = b.cc.toLowerCase().startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.cc.localeCompare(b.cc);
        })
        .slice(0, 8)
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

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSelect(trimmed, false, []);
    setOpen(false);
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      if (open && filtered.length > 0 && highlightedIndex >= 0) {
        e.preventDefault();
        const item = filtered[highlightedIndex];
        const resolved = resolveTemplateKeys(item);
        const hasTemplate = resolved.length > 0;
        onSelect(item.cc, hasTemplate, resolved);
        setInputValue(item.cc);
        setOpen(false);
      } else if (inputValue.trim()) {
        e.preventDefault();
        handleConfirm();
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
    <div ref={containerRef} className="relative">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          C.C (Chief Complaint)
        </label>
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
          {inputValue.trim() && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9 shrink-0"
              onClick={handleConfirm}
            >
              확인
            </Button>
          )}
        </div>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-white shadow-md dark:bg-zinc-900">
          {filtered.map((item, idx) => (
            <button
              key={item.cc}
              type="button"
              className={cn(
                "flex w-full items-center justify-between bg-white px-3 py-2.5 text-sm transition-colors dark:bg-zinc-900",
                idx === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60"
              )}
              onClick={() => {
                const resolved = resolveTemplateKeys(item);
                const hasTemplate = resolved.length > 0;
                onSelect(item.cc, hasTemplate, resolved);
                setInputValue(item.cc);
                setOpen(false);
              }}
            >
              <span>{item.cc}</span>
              {resolveTemplateKeys(item).length > 0 && (
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
  );
}
