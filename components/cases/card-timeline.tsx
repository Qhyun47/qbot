import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { formatTimeDisplay } from "@/lib/time/parse-time-tag";
import type { CaseInput } from "@/lib/supabase/types";

interface CardTimelineProps {
  cards: CaseInput[];
  readOnly?: boolean;
  generatedAt?: string;
}

export function CardTimeline({
  cards,
  readOnly = false,
  generatedAt,
}: CardTimelineProps) {
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

  const timedCards = cards
    .filter((c) => c.time_tag != null)
    .sort(
      (a, b) => (b.time_offset_minutes ?? 0) - (a.time_offset_minutes ?? 0)
    );

  const untimedCards = cards.filter((c) => c.time_tag == null);

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
                showTime
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

function InputCard({
  card,
  showTime,
  displayLabel,
  referenced,
}: {
  card: CaseInput;
  showTime?: boolean;
  displayLabel?: string;
  referenced?: boolean;
}) {
  return (
    <div
      className={cn(
        "shadow-xs flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-xs",
        referenced ? "bg-muted/40 text-muted-foreground" : "bg-card"
      )}
    >
      <span className="leading-normal">{card.raw_text}</span>
      {showTime && displayLabel && (
        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {displayLabel}
        </span>
      )}
    </div>
  );
}
