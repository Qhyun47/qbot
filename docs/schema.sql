-- 규봇 데이터베이스 스키마 DDL 초안
-- 실제 실행은 Task 009에서 Supabase MCP(apply_migration / execute_sql)로 수행
-- PostgreSQL 기준. Supabase의 uuid, pg_crypto extension은 기본 활성화 상태로 가정

-- ============================================================
-- 1. Enum 타입 생성
-- ============================================================

CREATE TYPE public.case_status AS ENUM (
  'draft',
  'generating',
  'completed',
  'failed'
);

CREATE TYPE public.bed_zone AS ENUM (
  'A',
  'B',
  'R'
);

CREATE TYPE public.input_layout AS ENUM (
  'single',
  'split_vertical',
  'split_horizontal'
);

-- ============================================================
-- 2. profiles 테이블 확장 (기존 테이블에 input_layout 컬럼 추가)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS input_layout public.input_layout NOT NULL DEFAULT 'single';

-- ============================================================
-- 3. cases 테이블 생성
--    current_result_id FK는 case_results 생성 후 ALTER TABLE로 추가 (순환 참조 처리)
-- ============================================================

CREATE TABLE public.cases (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bed_zone          public.bed_zone NOT NULL DEFAULT 'A',
  bed_number        integer     NOT NULL DEFAULT 1,
  cc                text,
  cc_has_template   boolean     NOT NULL DEFAULT false,
  template_key      text,
  status            public.case_status NOT NULL DEFAULT 'draft',
  current_result_id uuid,       -- FK는 case_results 생성 후 추가 (섹션 7 참고)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_bed_number CHECK (
    (bed_zone = 'A' AND bed_number BETWEEN 1 AND 8)  OR
    (bed_zone = 'B' AND bed_number BETWEEN 1 AND 11) OR
    (bed_zone = 'R' AND bed_number BETWEEN 1 AND 4)
  )
);

-- ============================================================
-- 4. case_inputs 테이블 생성
--    raw_text는 NOT NULL (원본 텍스트 보존 원칙 — 절대 수정 금지)
-- ============================================================

CREATE TABLE public.case_inputs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id              uuid        NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  raw_text             text        NOT NULL,
  time_tag             text,
  time_offset_minutes  integer,
  display_order        integer     NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. case_results 테이블 생성
-- ============================================================

CREATE TABLE public.case_results (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id            uuid        NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  structured_json    jsonb       NOT NULL,
  hpi_draft          text        NOT NULL,
  hpi_edited         text,
  template_draft     text        NOT NULL,
  template_edited    text,
  template_key_used  text        NOT NULL,
  model_version      text        NOT NULL,
  error_message      text,
  generated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. interview_guidelines 테이블 생성
--    user_id가 NULL이면 시스템 기본 가이드라인
-- ============================================================

CREATE TABLE public.interview_guidelines (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES public.profiles(id) ON DELETE CASCADE,
  guide_key   text        NOT NULL,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. cases.current_result_id FK 후처리 (순환 참조 해결)
--    cases → case_results 방향. case_results 삭제 시 NULL로 초기화
-- ============================================================

ALTER TABLE public.cases
  ADD CONSTRAINT cases_current_result_id_fkey
  FOREIGN KEY (current_result_id)
  REFERENCES public.case_results(id)
  ON DELETE SET NULL;

-- ============================================================
-- 8. updated_at 자동 갱신 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER interview_guidelines_updated_at
  BEFORE UPDATE ON public.interview_guidelines
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 9. Row Level Security (RLS) 활성화
--    실제 정책(POLICY) 작성은 Task 009에서 수행
-- ============================================================

ALTER TABLE public.cases               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_inputs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_guidelines ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. 인덱스 (Task 009에서 성능 테스트 후 추가 조정 가능)
-- ============================================================

CREATE INDEX IF NOT EXISTS cases_user_id_created_at_idx
  ON public.cases(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS case_inputs_case_id_display_order_idx
  ON public.case_inputs(case_id, display_order);

CREATE INDEX IF NOT EXISTS case_results_case_id_generated_at_idx
  ON public.case_results(case_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS interview_guidelines_user_id_guide_key_idx
  ON public.interview_guidelines(user_id, guide_key);

CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_created_at_idx
  ON public.ai_usage_logs(user_id, created_at DESC);

-- ============================================================
-- error_logs 테이블 — 사용자 제출 에러 로그
-- ============================================================

CREATE TABLE public.error_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_url      text        NOT NULL,
  error_message text        NOT NULL,
  stack_trace   text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can select all error logs"
  ON public.error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS error_logs_created_at_idx
  ON public.error_logs(created_at DESC);
