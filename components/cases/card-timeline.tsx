import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CaseInput } from "@/lib/supabase/types";

interface CardTimelineProps {
  cards: CaseInput[];
}

export function CardTimeline({ cards }: CardTimelineProps) {
  if (cards.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        입력된 카드가 없습니다
      </p>
    );
  }

  const timedCards = cards
    .filter((c) => c.time_tag != null)
    .sort(
      (a, b) => (a.time_offset_minutes ?? 0) - (b.time_offset_minutes ?? 0)
    );

  const untimedCards = cards.filter((c) => c.time_tag == null);

  return (
    <div className="flex flex-col gap-4">
      {timedCards.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">시간 순</p>
          {timedCards.map((card) => (
            <Card key={card.id}>
              <CardContent className="flex items-start justify-between gap-2 p-3">
                <span className="text-sm">{card.raw_text}</span>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {card.time_tag}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {untimedCards.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">시간 미상</p>
          {untimedCards.map((card) => (
            <Card key={card.id}>
              <CardContent className="p-3">
                <span className="text-sm">{card.raw_text}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
