"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { formatTimeDisplay } from "@/lib/time/parse-time-tag";
import type { CaseInput } from "@/lib/supabase/types";

interface CardTimelineProps {
  cards: CaseInput[];
  readOnly?: boolean;
  generatedAt?: string;
  onReorder?: (
    newCards: CaseInput[],
    movedId: string,
    targetSection: "timed" | "untimed" | null
  ) => void;
}

function isInTimedSection(card: CaseInput): boolean {
  if (card.section_override === "timed") return true;
  if (card.section_override === "untimed") return false;
  return card.time_tag != null;
}

export function CardTimeline({
  cards,
  readOnly = false,
  generatedAt,
  onReorder,
}: CardTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overContainer, setOverContainer] = useState<
    "timed" | "untimed" | null
  >(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          아직 입력된 내용이 없습니다.
        </p>
        {!readOnly && (
          <p className="text-xs text-muted-foreground">
            아래 입력창에 문진 키워드를 입력하세요.
          </p>
        )}
      </div>
    );
  }

  const timedCards = cards.filter(isInTimedSection).sort((a, b) => {
    if (a.section_override == null && b.section_override == null) {
      return (b.time_offset_minutes ?? 0) - (a.time_offset_minutes ?? 0);
    }
    return a.display_order - b.display_order;
  });

  const untimedCards = cards
    .filter((c) => !isInTimedSection(c))
    .sort((a, b) => a.display_order - b.display_order);

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverId(null);
      setOverContainer(null);
      return;
    }
    const overedId = over.id as string;
    setOverId(overedId);
    if (overedId === "droppable-timed") {
      setOverContainer("timed");
    } else if (overedId === "droppable-untimed") {
      setOverContainer("untimed");
    } else {
      const overCard = cards.find((c) => c.id === overedId);
      if (overCard) {
        setOverContainer(isInTimedSection(overCard) ? "timed" : "untimed");
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    setOverContainer(null);

    if (!over || !onReorder) return;

    const draggedId = active.id as string;
    const overedId = over.id as string;
    if (draggedId === overedId) return;

    const draggedCard = cards.find((c) => c.id === draggedId);
    if (!draggedCard) return;

    const draggedInTimed = isInTimedSection(draggedCard);

    let targetSection: "timed" | "untimed" | null = null;
    let newCards: CaseInput[];

    if (overedId === "droppable-timed" || overedId === "droppable-untimed") {
      const dest = overedId === "droppable-timed" ? "timed" : "untimed";
      if (
        (dest === "timed" && draggedInTimed) ||
        (dest === "untimed" && !draggedInTimed)
      )
        return;
      targetSection = dest;
      const updatedCard: CaseInput = {
        ...draggedCard,
        section_override: dest,
        time_tag: dest === "untimed" ? null : draggedCard.time_tag,
        time_offset_minutes:
          dest === "untimed" ? null : draggedCard.time_offset_minutes,
      };
      newCards = cards.map((c) => (c.id === draggedId ? updatedCard : c));
    } else {
      const overCard = cards.find((c) => c.id === overedId);
      if (!overCard) return;
      const overInTimed = isInTimedSection(overCard);

      if (draggedInTimed !== overInTimed) {
        targetSection = overInTimed ? "timed" : "untimed";
        const updatedCard: CaseInput = {
          ...draggedCard,
          section_override: targetSection,
          time_tag: targetSection === "untimed" ? null : draggedCard.time_tag,
          time_offset_minutes:
            targetSection === "untimed"
              ? null
              : draggedCard.time_offset_minutes,
        };
        const withoutDragged = cards.filter((c) => c.id !== draggedId);
        const overIndex = withoutDragged.findIndex((c) => c.id === overedId);
        withoutDragged.splice(overIndex, 0, updatedCard);
        newCards = withoutDragged.map((c, i) => ({
          ...c,
          display_order: i + 1,
        }));
      } else {
        const sectionCards = draggedInTimed ? timedCards : untimedCards;
        const fromIndex = sectionCards.findIndex((c) => c.id === draggedId);
        const toIndex = sectionCards.findIndex((c) => c.id === overedId);
        if (fromIndex === -1 || toIndex === -1) return;
        const reordered = [...sectionCards];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, draggedCard);
        const otherCards = cards.filter((c) =>
          draggedInTimed ? !isInTimedSection(c) : isInTimedSection(c)
        );
        const combined = draggedInTimed
          ? [...reordered, ...otherCards]
          : [...otherCards, ...reordered];
        newCards = combined.map((c, i) => ({ ...c, display_order: i + 1 }));
      }
    }

    onReorder(newCards, draggedId, targetSection);
  };

  const timedIds = timedCards.map((c) => c.id);
  const untimedIds = untimedCards.map((c) => c.id);

  if (readOnly) {
    return (
      <div className="flex flex-col gap-5">
        {timedCards.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" />
              시간 순
            </p>
            <div className="flex flex-col gap-1.5">
              {timedCards.map((card) => (
                <InputCard
                  key={card.id}
                  card={card}
                  showTime={card.time_tag != null}
                  displayLabel={
                    card.time_offset_minutes != null
                      ? formatTimeDisplay(card.time_offset_minutes)
                      : undefined
                  }
                  referenced={
                    generatedAt
                      ? new Date(card.created_at) <= new Date(generatedAt)
                      : false
                  }
                />
              ))}
            </div>
          </div>
        )}
        {untimedCards.length > 0 && (
          <div className="flex flex-col gap-2">
            {timedCards.length > 0 && <Separator />}
            <div className="flex flex-col gap-1.5">
              {untimedCards.map((card) => (
                <InputCard
                  key={card.id}
                  card={card}
                  referenced={
                    generatedAt
                      ? new Date(card.created_at) <= new Date(generatedAt)
                      : false
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-5">
        {(timedCards.length > 0 || overContainer === "timed") && (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" />
              시간 순
            </p>
            <SortableContext
              items={timedIds}
              strategy={verticalListSortingStrategy}
            >
              <DroppableZone
                id="droppable-timed"
                isEmpty={timedCards.length === 0}
                isOver={
                  overContainer === "timed" && overId === "droppable-timed"
                }
              >
                {timedCards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    showTime={card.time_tag != null}
                    displayLabel={
                      card.time_offset_minutes != null
                        ? formatTimeDisplay(card.time_offset_minutes)
                        : undefined
                    }
                    generatedAt={generatedAt}
                    isDragging={activeId === card.id}
                  />
                ))}
              </DroppableZone>
            </SortableContext>
          </div>
        )}

        {(untimedCards.length > 0 || timedCards.length > 0) && (
          <div className="flex flex-col gap-2">
            {timedCards.length > 0 && <Separator />}
            <SortableContext
              items={untimedIds}
              strategy={verticalListSortingStrategy}
            >
              <DroppableZone
                id="droppable-untimed"
                isEmpty={untimedCards.length === 0}
                isOver={
                  overContainer === "untimed" && overId === "droppable-untimed"
                }
              >
                {untimedCards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    generatedAt={generatedAt}
                    isDragging={activeId === card.id}
                  />
                ))}
              </DroppableZone>
            </SortableContext>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeCard && (
          <InputCard
            card={activeCard}
            showTime={activeCard.time_tag != null}
            displayLabel={
              activeCard.time_offset_minutes != null
                ? formatTimeDisplay(activeCard.time_offset_minutes)
                : undefined
            }
            isDragOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableZone({
  id,
  isEmpty,
  isOver,
  children,
}: {
  id: string;
  isEmpty: boolean;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-8 flex-col gap-1.5 rounded-md transition-colors",
        isEmpty && isOver && "border-2 border-dashed border-primary/40 p-2"
      )}
    >
      {children}
    </div>
  );
}

function SortableCard({
  card,
  showTime,
  displayLabel,
  generatedAt,
  isDragging,
}: {
  card: CaseInput;
  showTime?: boolean;
  displayLabel?: string;
  generatedAt?: string;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <InputCard
        card={card}
        showTime={showTime}
        displayLabel={displayLabel}
        referenced={
          generatedAt
            ? new Date(card.created_at) <= new Date(generatedAt)
            : false
        }
        isDragging={isDragging ?? isSortableDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function InputCard({
  card,
  showTime,
  displayLabel,
  referenced,
  isDragging,
  isDragOverlay,
  dragHandleProps,
}: {
  card: CaseInput;
  showTime?: boolean;
  displayLabel?: string;
  referenced?: boolean;
  isDragging?: boolean;
  isDragOverlay?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}) {
  return (
    <div
      className={cn(
        "shadow-xs flex items-start gap-1.5 rounded-md border px-2 py-2 text-xs",
        referenced ? "bg-muted/40 text-muted-foreground" : "bg-card",
        isDragging && !isDragOverlay && "opacity-40",
        isDragOverlay && "shadow-lg ring-1 ring-primary/20"
      )}
    >
      {dragHandleProps && (
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="드래그하여 순서 변경"
          {...dragHandleProps}
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      <span className="flex-1 leading-normal">{card.raw_text}</span>
      {showTime && displayLabel && (
        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {displayLabel}
        </span>
      )}
    </div>
  );
}
