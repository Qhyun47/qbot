"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={inputValue}
        placeholder="C.C. 입력 (예: Chest pain)"
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border bg-background shadow-md">
          {filtered.map((item) => (
            <button
              key={item.cc}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
              onClick={() => {
                onSelect(item.cc, item.hasTemplate, item.templateKey);
                setInputValue(item.cc);
                setOpen(false);
              }}
            >
              <span>{item.cc}</span>
              {item.hasTemplate && (
                <Badge variant="secondary" className="text-xs">
                  상용구 있음
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
