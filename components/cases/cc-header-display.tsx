"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CcHeaderDisplayProps {
  cc: string | null;
  ccs: string[] | null;
}

export function CcHeaderDisplay({ cc, ccs }: CcHeaderDisplayProps) {
  const list = ccs?.length ? ccs : cc ? [cc] : null;

  if (!list) {
    return (
      <span className="font-normal italic text-muted-foreground">
        C.C 미입력
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate">{list[0]}</span>
      {list.length > 1 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground hover:bg-muted/80">
              +{list.length - 1}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start" side="bottom">
            <ul className="flex flex-col gap-1">
              {list.slice(1).map((item, i) => (
                <li key={i} className="text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </span>
  );
}
