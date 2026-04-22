"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CardTimeline } from "@/components/cases/card-timeline";
import { CardInputBar } from "@/components/cases/card-input-bar";
import { addCaseInput } from "@/lib/cases/actions";
import type { CaseInput } from "@/lib/supabase/types";

interface CaseInputPanelProps {
  caseId: string;
  initialCards: CaseInput[];
  generatedAt?: string;
}

export function CaseInputPanel({
  caseId,
  initialCards,
  generatedAt,
}: CaseInputPanelProps) {
  const [cards, setCards] = useState<CaseInput[]>(initialCards);
  const [, startTransition] = useTransition();

  const [optimisticCards, addOptimisticCard] = useOptimistic(
    cards,
    (state: CaseInput[], newCard: CaseInput) => [newCard, ...state]
  );

  const handleCardSubmit = (
    rawText: string,
    timeTag: string | null,
    timeOffsetMinutes: number | null
  ) => {
    const tempCard: CaseInput = {
      id: crypto.randomUUID(),
      case_id: caseId,
      raw_text: rawText,
      time_tag: timeTag,
      time_offset_minutes: timeOffsetMinutes,
      display_order: cards.length + 1,
      created_at: new Date().toISOString(),
    };
    startTransition(async () => {
      addOptimisticCard(tempCard);
      const saved = await addCaseInput(
        caseId,
        rawText,
        timeTag,
        timeOffsetMinutes
      );
      setCards((prev) => [saved, ...prev]);
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          입력 카드
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <CardTimeline cards={optimisticCards} generatedAt={generatedAt} />
      </div>
      <CardInputBar onSubmit={handleCardSubmit} />
    </div>
  );
}
