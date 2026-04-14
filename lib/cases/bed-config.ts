import type { BedZone } from "@/lib/supabase/types";

export const BED_NUMBERS_BY_ZONE = {
  A: [1, 2, 3, 4, 5, 6, 7, 8],
  B: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  R: [1, 2, 3, 4],
} as const satisfies Record<BedZone, readonly number[]>;

export const DEFAULT_BED_ZONE: BedZone = "A";
export const DEFAULT_BED_NUMBER = 1;
