export interface StructuredCaseInput {
  raw_text: string;
  normalized_text: string;
  category: string;
  sections: Array<"hpi" | "template" | "history">;
}

export interface StructuredCase {
  inputs: StructuredCaseInput[];
  past_history: string[] | null;
  medication_history: string[] | null;
  operation_history: string[] | null;
  family_history: string[] | null;
  // C.C. 특화 필드 (onset, character, ntg_response 등 스키마별 상이)
  [key: string]: unknown;
}
