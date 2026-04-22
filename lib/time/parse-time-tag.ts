type ParseResult = {
  timeTag: string | null;
  timeOffsetMinutes: number | null;
};

function absoluteDayOffset(dayNum: number, ref: Date): number {
  // 해당 월의 N일 오전 12시를 기준으로 계산. 미래이면 전달로 이동
  const candidate = new Date(
    ref.getFullYear(),
    ref.getMonth(),
    dayNum,
    12,
    0,
    0
  );
  if (candidate > ref) {
    candidate.setMonth(candidate.getMonth() - 1);
  }
  return Math.max(0, Math.round((ref.getTime() - candidate.getTime()) / 60000));
}

function absoluteMonthDayOffset(month: number, day: number, ref: Date): number {
  // N월 M일 오전 12시 기준. 미래이면 작년으로 이동
  const candidate = new Date(ref.getFullYear(), month - 1, day, 12, 0, 0);
  if (candidate > ref) {
    candidate.setFullYear(candidate.getFullYear() - 1);
  }
  return Math.max(0, Math.round((ref.getTime() - candidate.getTime()) / 60000));
}

export function parseTimeTag(
  text: string,
  referenceDate: Date = new Date()
): ParseResult {
  // 상대 표현 패턴 (절대 날짜보다 먼저 검사)
  const relativeChecks: Array<{
    regex: RegExp;
    compute: (m: RegExpMatchArray) => number;
  }> = [
    { regex: /(\d+)일\s*전/, compute: (m) => Number(m[1]) * 1440 },
    { regex: /(\d+)시간\s*전/, compute: (m) => Number(m[1]) * 60 },
    { regex: /(\d+)분\s*전/, compute: (m) => Number(m[1]) * 1 },
    { regex: /어제/, compute: () => 1440 },
    { regex: /그제/, compute: () => 2880 },
    { regex: /오늘/, compute: () => 0 },
    { regex: /(\d+)\s*days?\s*ago/i, compute: (m) => Number(m[1]) * 1440 },
    { regex: /(\d+)\s*hours?\s*ago/i, compute: (m) => Number(m[1]) * 60 },
  ];

  for (const { regex, compute } of relativeChecks) {
    const match = text.match(regex);
    if (match) {
      return { timeTag: match[0], timeOffsetMinutes: compute(match) };
    }
  }

  // 절대 날짜: "4월 19일", "4월19일"
  const monthDayMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (monthDayMatch) {
    const month = Number(monthDayMatch[1]);
    const day = Number(monthDayMatch[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        timeTag: monthDayMatch[0],
        timeOffsetMinutes: absoluteMonthDayOffset(month, day, referenceDate),
      };
    }
  }

  // 절대 날짜: "19일" ("전"이 뒤에 오지 않는 경우만)
  const dayMatch = text.match(/(\d{1,2})일(?!\s*전)/);
  if (dayMatch) {
    const day = Number(dayMatch[1]);
    if (day >= 1 && day <= 31) {
      return {
        timeTag: dayMatch[0],
        timeOffsetMinutes: absoluteDayOffset(day, referenceDate),
      };
    }
  }

  return { timeTag: null, timeOffsetMinutes: null };
}

/**
 * time_offset_minutes와 기준 시각으로 통일된 표기 문자열을 반환한다.
 * - 0일: 오늘
 * - 1일: 어제
 * - 2~6일: N일 전
 * - 7일+: 13일 / 3월 30일 / 25년 12월 31일
 */
export function formatTimeDisplay(
  offsetMinutes: number,
  referenceDate: Date = new Date()
): string {
  const pastTime = new Date(referenceDate.getTime() - offsetMinutes * 60000);

  const refDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const pastDay = new Date(
    pastTime.getFullYear(),
    pastTime.getMonth(),
    pastTime.getDate()
  );
  const dayDiff = Math.round((refDay.getTime() - pastDay.getTime()) / 86400000);

  if (dayDiff <= 0) return "오늘";
  if (dayDiff === 1) return "어제";
  if (dayDiff <= 6) return `${dayDiff}일 전`;

  const refYear = referenceDate.getFullYear();
  const pastYear = pastTime.getFullYear();
  const pastMonth = pastTime.getMonth() + 1;
  const pastDate = pastTime.getDate();

  if (pastYear !== refYear) {
    return `${String(pastYear).slice(2)}년 ${pastMonth}월 ${pastDate}일`;
  }
  if (pastMonth !== referenceDate.getMonth() + 1) {
    return `${pastMonth}월 ${pastDate}일`;
  }
  return `${pastDate}일`;
}
