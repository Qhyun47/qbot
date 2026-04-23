"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CardTimeline } from "@/components/cases/card-timeline";
import { CardInputBar } from "@/components/cases/card-input-bar";
import { addCaseInput } from "@/lib/cases/actions";
import type { CaseInput } from "@/lib/supabase/types";

interface CardInputSectionProps {
  caseId: string;
  initialCards: CaseInput[];
  generatedAt?: string;
}

export function CardInputSection({
  caseId,
  initialCards,
  generatedAt,
}: CardInputSectionProps) {
  const [cards, setCards] = useState<CaseInput[]>(initialCards);
  const [, startTransition] = useTransition();

  const [optimisticCards, addOptimisticCard] = useOptimistic(
    cards,
    (state: CaseInput[], newCard: CaseInput) => [...state, newCard]
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
      section_override: null,
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
    <div className="flex flex-col">
      <CardTimeline cards={optimisticCards} generatedAt={generatedAt} />
      <div className="mt-2">
        <CardInputBar onSubmit={handleCardSubmit} />
      </div>
    </div>
  );
}
