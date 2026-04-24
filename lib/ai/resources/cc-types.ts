export interface CcConnectionEntry {
  key: string;
  rank: number;
}

export interface CcListEntry {
  cc: string;
  guideKeys: CcConnectionEntry[];
  templateKeys: CcConnectionEntry[];
  aliasOf?: string;
  patternOf?: string;
}

/** rank===0 항목의 key 반환, 없으면 null */
export function getPrimaryKey(entries: CcConnectionEntry[]): string | null {
  return entries.find((e) => e.rank === 0)?.key ?? null;
}

/** key만 추출하여 rank 오름차순 정렬 */
export function getKeyStrings(entries: CcConnectionEntry[]): string[] {
  return [...entries].sort((a, b) => a.rank - b.rank).map((e) => e.key);
}

/**
 * aliasOf/patternOf 원본 항목의 연결을 상속한 뒤 rank 오름차순으로 정렬.
 * 원본이 없거나 항목 자체에 연결이 있으면 그대로 반환.
 */
export function resolveEntries(
  item: CcListEntry,
  type: "guideKeys" | "templateKeys",
  list: CcListEntry[]
): CcConnectionEntry[] {
  const own = item[type];
  if (own.length > 0) return [...own].sort((a, b) => a.rank - b.rank);

  const parentCc = item.aliasOf ?? item.patternOf;
  if (!parentCc) return own;

  const parent = list.find((e) => e.cc === parentCc);
  if (!parent) return own;

  return [...parent[type]].sort((a, b) => a.rank - b.rank);
}
