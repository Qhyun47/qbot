"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rows2, Columns2, Square, Zap } from "lucide-react";
import { CardInputBar } from "@/components/cases/card-input-bar";
import { CardTimeline } from "@/components/cases/card-timeline";
import { CcAutocomplete } from "@/components/cases/cc-autocomplete";
import { BedPicker } from "@/components/cases/bed-picker";
import { GuidelinePanel } from "@/components/cases/guideline-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MOCK_CASES, MOCK_GUIDE_CONTENT } from "@/lib/mock/cases";
import type { BedZone, CaseInput, InputLayout } from "@/lib/supabase/types";

const LAYOUT_OPTIONS: {
  value: InputLayout;
  Icon: React.FC<{ className?: string }>;
  label: string;
}[] = [
  { value: "single", Icon: Square, label: "단독" },
  { value: "split_vertical", Icon: Rows2, label: "상하" },
  { value: "split_horizontal", Icon: Columns2, label: "좌우" },
];

export default function NewCasePage() {
  const router = useRouter();
  const [bedZone, setBedZone] = useState<BedZone>("A");
  const [bedNumber, setBedNumber] = useState(1);
  const [cc, setCc] = useState<string | null>(null);
  const [cards, setCards] = useState<CaseInput[]>([]);
  const [layout, setLayout] = useState<InputLayout>("single");

  const guideContent = cc ? MOCK_GUIDE_CONTENT : null;

  const handleBedChange = (zone: BedZone, number: number) => {
    setBedZone(zone);
    setBedNumber(number);
  };

  const handleCcSelect = (
    selectedCc: string,
    _hasTemplate: boolean,
    _templateKey: string | null
  ) => {
    setCc(selectedCc);
  };

  const handleCardSubmit = (
    rawText: string,
    timeTag: string | null,
    timeOffsetMinutes: number | null
  ) => {
    const newCard: CaseInput = {
      id: crypto.randomUUID(),
      case_id: MOCK_CASES[0].id,
      raw_text: rawText,
      time_tag: timeTag,
      time_offset_minutes: timeOffsetMinutes,
      display_order: cards.length + 1,
      created_at: new Date().toISOString(),
    };
    setCards((prev) => [newCard, ...prev]);
  };

  const InputArea = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 p-4">
        <BedPicker
          bedZone={bedZone}
          bedNumber={bedNumber}
          onChange={handleBedChange}
        />
      </div>
      <Separator />
      <div className="shrink-0 p-4">
        <CcAutocomplete value={cc ?? ""} onSelect={handleCcSelect} />
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto p-4">
        <CardTimeline cards={cards} />
      </div>
      <CardInputBar onSubmit={handleCardSubmit} />
    </div>
  );

  const GuideArea = (
    <div className="h-full border-l">
      <GuidelinePanel content={guideContent} cc={cc} />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* 페이지 헤더 */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
        <span className="text-sm font-semibold">새 케이스 입력</span>
        <div className="flex items-center gap-2">
          {/* 레이아웃 전환 토글 */}
          <div className="hidden items-center gap-0.5 rounded-md border p-0.5 md:flex">
            {LAYOUT_OPTIONS.map(({ value, Icon, label }) => (
              <button
                key={value}
                type="button"
                aria-label={`${label} 레이아웃`}
                title={label}
                onClick={() => setLayout(value)}
                className={cn(
                  "rounded p-1.5 transition-colors",
                  layout === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => router.push(`/cases/${MOCK_CASES[0].id}`)}
            className="gap-1.5"
          >
            <Zap className="size-3.5" />
            차팅 생성
          </Button>
        </div>
      </header>

      {/* 레이아웃 본문 */}
      {layout === "single" && (
        <div className="flex-1 overflow-hidden">{InputArea}</div>
      )}

      {layout === "split_vertical" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="h-60 shrink-0 overflow-hidden border-b">
            {GuideArea}
          </div>
          <div className="flex-1 overflow-hidden">{InputArea}</div>
        </div>
      )}

      {layout === "split_horizontal" && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">{InputArea}</div>
          <div className="w-2/5 overflow-hidden">{GuideArea}</div>
        </div>
      )}
    </div>
  );
}
