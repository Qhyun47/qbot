// TODO(schema-v2): Task 010 AI 파이프라인 구현 시 Gemini Structured Output 스키마 확정 후 이 파일 전면 교체

export interface StructuredCase {
  cc: string | null;
  inputs: Array<{
    raw_text: string;
    time_tag: string | null;
    time_offset_minutes: number | null;
    normalized_text: string;
  }>;
  // TODO(schema-v2): 추가 필드는 Task 010 확정 후 반영
}
