"use client";

import { useEffect, useRef, useState } from "react";
import { CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ccList from "@/lib/ai/resources/cc-list.json";

interface CcAutocompleteProps {
  value: string;
  onSelect: (
    cc: string,
    hasTemplate: boolean,
    templateKey: string | null
  ) => void;
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const item = filtered[highlightedIndex];
      onSelect(item.cc, item.hasTemplate, item.templateKey);
      setInputValue(item.cc);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          C.C (Chief Complaint)
        </label>
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
          className="h-9"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md">
          {filtered.map((item, idx) => (
            <button
              key={item.cc}
              type="button"
              className={cn(
                "flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors",
                idx === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60"
              )}
              onClick={() => {
                onSelect(item.cc, item.hasTemplate, item.templateKey);
                setInputValue(item.cc);
                setOpen(false);
              }}
            >
              <span>{item.cc}</span>
              {item.hasTemplate && (
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
