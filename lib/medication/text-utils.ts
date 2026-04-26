// Med Hx / Past Hx 라인 변형 전체 대응: "Med Hx:", "Med Hx :", "Med Hx.", "Med Hx. :", "Med Hx. "
// 한국어 전각 콜론 '：'(U+FF1A)도 처리
const MED_HX_REGEX = /^([ \t]*Med[ \t]*Hx\.?[ \t]*[:：]?[ \t]*.*)$/m;
const PAST_HX_REGEX = /^[ \t]*Past[ \t]*Hx\.?[ \t]*[:：]?[ \t]*(.*)$/m;

export function insertMedListToHistory(
  history: string,
  medListText: string
): string {
  if (!history) return medListText;

  const match = MED_HX_REGEX.exec(history);
  if (!match) {
    return history.trimEnd() + "\n\n" + medListText;
  }

  const matchEnd = match.index + match[0].length;
  const before = history.slice(0, matchEnd);
  const after = history.slice(matchEnd);

  // 삽입 후 중복 빈 줄 정규화
  const joined = before + "\n" + medListText + after;
  return joined.replace(/\n{3,}/g, "\n\n");
}

export function extractPastHx(history: string): string {
  if (!history) return "";
  const match = PAST_HX_REGEX.exec(history);
  return match ? match[1].trim() : "";
}
