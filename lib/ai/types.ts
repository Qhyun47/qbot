// TODO(Task 010): Gemini Structured Output 스키마 확정 후 이 파일 전면 교체.
// 각 C.C.별 스키마는 lib/ai/resources/schemas/{templateKey}.json 참조.
// loadSchema(templateKey)로 런타임에 로드하며, Task 010에서 타입 자동 생성 또는 수동 확정 예정.

export interface StructuredCase {
  cc: string | null;
  inputs: Array<{
    raw_text: string;
    time_tag: string | null;
    time_offset_minutes: number | null;
    normalized_text: string;
    category: string;
    sections: Array<"hpi" | "template" | "history">;
  }>;
  past_history: string[] | null;
  medication_history: string[] | null;
  operation_history: string[] | null;
  family_history: string[] | null;
  // TODO(Task 010): C.C.별 특화 필드는 schemas/{cc}.json 기반으로 확정 후 반영
  [key: string]: unknown;
}
