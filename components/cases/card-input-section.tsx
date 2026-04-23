"use client";

import { useState } from "react";
import { CardTimeline } from "@/components/cases/card-timeline";
import { CardInputBar } from "@/components/cases/card-input-bar";
import {
  addCaseInput,
  reorderCaseInputs,
  moveCaseInputSection,
} from "@/lib/cases/actions";
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

  const handleCardSubmit = async (
    rawText: string,
    timeTag: string | null,
    timeOffsetMinutes: number | null
  ) => {
    const tempId = crypto.randomUUID();
    const tempCard: CaseInput = {
      id: tempId,
      case_id: caseId,
      raw_text: rawText,
      time_tag: timeTag,
      time_offset_minutes: timeOffsetMinutes,
      section_override: null,
      display_order: cards.length + 1,
      created_at: new Date().toISOString(),
    };
    setCards((prev) => [...prev, tempCard]);
    try {
      const saved = await addCaseInput(
        caseId,
        rawText,
        timeTag,
        timeOffsetMinutes
      );
      setCards((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
    } catch {
      setCards((prev) => prev.filter((c) => c.id !== tempId));
    }
  };

  const handleCardReorder = (
    newCards: CaseInput[],
    movedId: string,
    targetSection: "timed" | "untimed" | null
  ) => {
    setCards(newCards);
    const orderUpdates = newCards.map((c) => ({
      id: c.id,
      displayOrder: c.display_order,
    }));
    reorderCaseInputs(orderUpdates).catch(() => {});
    if (targetSection) {
      moveCaseInputSection(movedId, targetSection).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col">
      <CardTimeline
        cards={cards}
        generatedAt={generatedAt}
        onReorder={handleCardReorder}
      />
      <div className="mt-2">
        <CardInputBar onSubmit={handleCardSubmit} />
      </div>
    </div>
  );
}
