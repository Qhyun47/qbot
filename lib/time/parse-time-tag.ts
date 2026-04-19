type ParseResult = {
  timeTag: string | null;
  timeOffsetMinutes: number | null;
};

type Pattern =
  | { regex: RegExp; unit: number; fixed?: never }
  | { regex: RegExp; fixed: number; unit?: never };

const PATTERNS: Pattern[] = [
  { regex: /(\d+)일\s*전/, unit: 1440 },
  { regex: /(\d+)시간\s*전/, unit: 60 },
  { regex: /(\d+)분\s*전/, unit: 1 },
  { regex: /어제/, fixed: 1440 },
  { regex: /그제/, fixed: 2880 },
  { regex: /오늘/, fixed: 0 },
  { regex: /(\d+)\s*days?\s*ago/i, unit: 1440 },
  { regex: /(\d+)\s*hours?\s*ago/i, unit: 60 },
];

export function parseTimeTag(text: string): ParseResult {
  for (const pattern of PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      const timeTag = match[0];
      const timeOffsetMinutes =
        pattern.fixed !== undefined
          ? pattern.fixed
          : Number(match[1]) * (pattern.unit ?? 1);
      return { timeTag, timeOffsetMinutes };
    }
  }
  return { timeTag: null, timeOffsetMinutes: null };
}
