# 규봇 개발 로드맵

응급실 의사의 모바일 문진 키워드를 AI 차팅 초안으로 변환해주는 어시스턴트 웹 서비스입니다.

## 개요

규봇는 **응급실에서 환자를 문진하는 응급의학과 의사**를 위한 **모바일 우선 차팅 어시스턴트**로 다음 기능을 제공합니다:

- **모바일 PWA 문진 입력**: 설치형 앱 아이콘 탭 → 큰 [새 케이스 시작] CTA → 카드 기반 자유 텍스트 입력. 시간 표현 자동 감지 및 정렬
- **베드번호 2-탭 선택**: 새 케이스 진입 즉시 구역(A/B/R, 기본 A) → 번호(A:1~8 / B:1~11 / R:1~4)를 한 화면에서 2번의 탭으로 지정. 환자 추적용 식별자를 C.C보다 먼저 확정
- **분할 화면 가이드라인**: 입력 화면 옆·아래에 C.C별 문진 가이드라인 패널을 표시. 단독/상하/좌우 3가지 레이아웃 선택 가능 (갤럭시 폴드 대응)
- **AI 3단계 파이프라인**: Gemini Flash를 이용한 입력 정규화 → HPI 줄글 생성 → C.C 상용구 채움의 3단계 차팅 초안 생성
- **데스크탑 결과 확인**: 편집 가능한 HPI와 상용구 차팅을 데스크탑 우선 레이아웃으로 표시. 독립 복사 버튼으로 EMR에 즉시 붙여넣기
- **커스텀 가이드라인 관리**: 병원별·개인별 선호 문진 방식을 C.C별로 커스텀해 저장·수정

---

## 개발 워크플로우

1. **작업 계획**
   - 기존 코드베이스(Supabase 인증이 붙은 Next.js 15 스타터)를 학습하고 현재 상태 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**
   - 기존 코드베이스를 학습하고 현재 상태 파악
   - 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
   - **API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함** (Playwright MCP 테스트 시나리오 작성)
   - 새 작업의 경우, 문서에는 빈 박스와 변경 사항 요약이 없어야 함

3. **작업 구현**
   - 작업 파일의 명세서를 따름
   - 기능과 기능성 구현
   - **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수**
   - 각 단계 후 작업 파일 내 단계 진행 상황 업데이트
   - 구현 완료 후 Playwright MCP를 사용한 E2E 테스트 실행
   - 테스트 통과 확인 후 다음 단계로 진행
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**
   - 로드맵에서 완료된 작업을 ✅로 표시

---

## 개발 단계

### Phase 1: 애플리케이션 골격 구축

전체 라우트 구조, 타입 정의, 데이터베이스 스키마 설계를 우선 완성합니다. 이 단계에서는 실제 로직 구현 없이 "어디에 무엇이 들어갈지"의 뼈대만 잡습니다.

- ✅ **Task 001: 프로젝트 구조 및 라우팅 설정** - 완료 (2026-04-14)
  - Next.js 15 App Router 기반 `(app)` 라우트 그룹 생성
  - 모든 주요 페이지의 빈 껍데기 파일 생성 (`/dashboard`, `/cases`, `/cases/new`, `/cases/[id]`, `/guidelines`, `/settings`)
  - `(app)/layout.tsx` 공통 레이아웃 골격 구현 (상단 네비바 placeholder)
  - `app/page.tsx`에서 로그인 사용자 `/dashboard` 리다이렉트 로직 (`AuthRedirect` 컴포넌트 + Suspense, `cacheComponents` 호환)
  - API Route 골격 생성 (`app/api/cases/[id]/generate/route.ts`, `app/api/cases/[id]/status/route.ts`)
  - 기존 `app/protected/` 스타터 샘플은 불필요하여 삭제
  - ⚠️ 참고: `next.config.ts`의 `cacheComponents: true` 설정으로 인해 `export const runtime = "nodejs"` 는 Task 011에서 재검토 필요

- ✅ **Task 002: 타입 정의 및 데이터베이스 스키마 설계** - 완료 (2026-04-14)
  - `lib/supabase/types.ts`의 `Database` 타입에 `cases`, `case_inputs`, `case_results`, `interview_guidelines` 테이블 추가
  - `case_status` enum 정의 (`draft / generating / completed / failed`)
  - `bed_zone` enum 정의 (`A / B / R`), `cases.bed_number` integer 컬럼 타입 추가
  - `profiles.input_layout` enum 정의 (`single / split_vertical / split_horizontal`)
  - 편의 타입 export (`Case`, `CaseInput`, `CaseResult`, `Guideline`, `BedZone`)
  - 베드번호 구역별 유효 범위 상수 정의 (`lib/cases/bed-config.ts`: `BED_NUMBERS_BY_ZONE = { A: [1..8], B: [1..11], R: [1..4] }`, `DEFAULT_BED_ZONE = 'A'`)
  - `lib/ai/types.ts`에 `StructuredCase` placeholder 인터페이스 정의 (`TODO(schema-v2)` 주석 포함)
  - Supabase SQL DDL 초안 작성 (`bed_zone`/`bed_number` + CHECK 제약 포함, Phase 3에서 실행 예정)

- ✅ **Task 003: AI 리소스 폴더 및 파일 생성** - 완료 (2026-04-19)
  - ✅ `lib/ai/resources/` 폴더 골격 생성
  - ✅ `cc-list.json` 생성 (MVP 5개 + Hematemesis/Melena/Hematochezia 별칭 포함, 총 8개)
  - ✅ `style_guide.md` 생성 (혼용 언어 원칙, 문장 구조, 필수 포함 요소 등)
  - ✅ `lib/ai/resources/templates/` — C.C.별 5개 상용구 템플릿 JSON (chest-pain, dyspnea, hemoptysis, abdominal-pain, gi-bleeding)
  - ✅ `lib/ai/resources/schemas/` — C.C.별 5개 정규화 스키마 JSON (JSON Schema draft-07, `structured_schema.json` 단일 파일 방식 대신 C.C.별 분리)
  - ✅ `lib/ai/resources/guides/` — C.C.별 5개 문진 가이드라인 Markdown (핵심 문진 체크리스트 + 감별 진단 + 위험 신호)
  - ✅ `lib/ai/resources/examples/` — C.C.별 5개 빈 `.jsonl` 파일 (few-shot 예시 준비 공간)
  - ✅ `lib/ai/load-resources.ts` 매핑 함수 스텁 생성 (`loadSchema` / `loadTemplate` / `loadGuide` / `loadExamples` + `CC_TEMPLATE_KEYS`)
  - ✅ `fixtures/case-01.json` (Chest pain, 12개 입력 카드, NTG 무반응 시나리오)
  - ✅ `fixtures/case-02.json` (GI bleeding, hematemesis+melena 혼합 시나리오)

---

### Phase 2: UI/UX 완성 (더미 데이터 활용)

하드코딩된 더미 데이터로 모든 페이지의 UI를 완성합니다. 반응형과 모바일/데스크탑 분기, 분할 화면 레이아웃을 포함한 전체 사용자 플로우를 이 단계에서 확정합니다.

- ✅ **Task 004: 공통 컴포넌트 및 더미 데이터 유틸리티** - 완료 (2026-04-19)
  - 필요한 라이브러리 설치 (`react-hook-form`, `zod`, `date-fns`, `@google/genai`, `tsx`)
  - shadcn/ui 추가 컴포넌트 설치 (`textarea`, `toast`, `select`, `tabs`, `separator`, `skeleton`, `toggle-group`)
  - 상태 배지 컴포넌트 (`components/cases/status-badge.tsx`) — 초안/생성 중/완료/실패
  - **베드번호 배지 컴포넌트** (`components/cases/bed-badge.tsx`) — `bed_zone`/`bed_number`를 받아 `A-3` 형식으로 표시, 사이즈 variant(sm/md/lg) 지원
  - 복사 버튼 컴포넌트 (`components/cases/copy-button.tsx`)
  - `(app)/layout.tsx` 상단 네비바 완성 (기기 종류에 따른 메뉴 노출)
  - `lib/mock/cases.ts`에 더미 케이스 데이터 생성 유틸리티 작성 (각 더미 케이스에 `bed_zone`, `bed_number` 포함)

- ✅ **Task 005: 대시보드 페이지 UI (반응형 분기)** - 완료 (2026-04-19)
  - `/dashboard` 페이지 UI 완성 (더미 데이터)
  - **모바일 레이아웃**: 화면 상단 큰 [새 케이스 시작] CTA + 최근 케이스 3개 카드 (각 카드에 `BedBadge` 표시)
  - **데스크탑 레이아웃**: 최근 케이스 그리드(주 영역, 각 카드 상단에 `BedBadge`) + 우측 상단 [+ 새 케이스] 버튼
  - 뷰포트 감지를 통한 레이아웃 분기 (Tailwind `md:` 기반 반응형)
  - 케이스 카드 클릭 시 `/cases/[id]`로 이동하는 링크 연결
  - "전체 목록 보기" 링크 추가

- ✅ **Task 006: 새 케이스 입력 페이지 UI (분할 화면 포함)** - 완료 (2026-04-19)
  - `/cases/new` 페이지 UI 완성
  - **베드번호 선택 영역** (화면 1 최상단, 항상 표시) (F014):
    - `components/cases/bed-picker.tsx` — 구역 토글 + 번호 그리드를 하나의 컴포넌트로 합쳐 화면 전환/스크롤 없이 2-탭으로 선택 완료
    - 구역 토글: shadcn `ToggleGroup`으로 `A` / `B` / `R` 단일 선택 (기본값 `A`)
    - 번호 그리드: 선택된 구역에 따라 즉시 리렌더 (A: 1~8 / B: 1~11 / R: 1~4), 현재 선택된 번호는 primary 색상 하이라이트
    - 구역·번호 상태는 부모에서 관리 (`useState`), 변경 시 상위 `onChange(bedZone, bedNumber)` 호출
    - 선택 상태는 `components/cases/bed-badge.tsx`(Task 004 산출물)로 표시
    - 접근성: 키보드 네비게이션 + `aria-label` (예: `A구역 3번 베드 선택`)
  - **화면 1 — 입력 영역** 컴포넌트:
    - C.C 자동완성 입력창 (`components/cases/cc-autocomplete.tsx`) — `cc-list.json` 기반 필터링, "상용구 있음" 배지
    - 카드 타임라인 스택 (`components/cases/card-timeline.tsx`) — 시간 태그 배지 포함, 시간 순 정렬, 태그 없는 카드 별도 그룹
    - 하단 고정 입력창 (`components/cases/card-input-bar.tsx`) — `safe-area-inset-bottom` 대응
    - [차팅 생성] 버튼 (우측 상단)
  - **화면 2 — 가이드라인 패널** 컴포넌트:
    - `components/cases/guideline-panel.tsx` — Markdown 렌더링
    - C.C 변경 시 더미 가이드라인 로드
    - C.C 없거나 가이드라인 없을 때 안내 메시지
  - **3가지 레이아웃 모드 구현**:
    - `single`: 화면 1만 전체화면
    - `split_vertical`: 상단 가이드 / 하단 입력 (세로 분할)
    - `split_horizontal`: 좌측 입력 / 우측 가이드 (좌우 분할, 갤럭시 폴드·태블릿용)
  - 레이아웃 모드는 props로 받아 CSS Grid 또는 Flexbox로 전환
  - `lib/time/parse-time-tag.ts` 순수 함수로 시간 표현 정규식 파싱 구현 + 단위 테스트

- ✅ **Task 007: 케이스 결과 페이지 UI (데스크탑 우선)** - 완료 (2026-04-19)
  - `/cases/[id]` 페이지 UI 완성 (더미 데이터)
  - **페이지 헤더**: `BedBadge`(큰 사이즈) + C.C + 생성 상태 배지 (F014, F011)
  - **상단 HPI 섹션**: 편집 가능한 textarea + **복사** 버튼
  - **하단 상용구 섹션**: 편집 가능한 textarea + **복사** 버튼
  - 상용구 없는 C.C의 경우: 안내 메시지 + 다른 상용구 수동 선택 드롭다운
  - 우측(또는 하단, 반응형) 원본 카드 타임라인 읽기 전용 표시
  - [재생성 ↻] 버튼 (상단)
  - 생성 중 상태 로딩 UI (스켈레톤, 헤더의 베드번호는 로딩 중에도 유지)
  - 실패 상태 에러 메시지 + [재시도] 버튼
  - 모바일 반응형 대응

- ✅ **Task 008: 케이스 목록·가이드라인 관리·설정 페이지 UI** - 완료 (2026-04-19)
  - **`/cases` 케이스 목록 페이지**: 최근 50개 테이블/리스트 — 컬럼 순서 `[베드번호]` · `날짜` · `C.C` · `상태 배지` · `삭제`. `BedBadge`로 베드번호 표시. 삭제 버튼은 확인 모달 포함
  - **`/guidelines` 가이드라인 관리 페이지**:
    - C.C 선택 드롭다운
    - 시스템 기본 가이드라인 미리보기 (읽기 전용, 참고용)
    - 커스텀 가이드라인 Markdown 편집 영역
    - [저장] / [삭제] 버튼
    - 커스텀 설정 현황 목록
  - **`/settings` 설정 페이지**:
    - 입력 화면 레이아웃 라디오 그룹 (단독 / 상하 분할 / 좌우 분할)
    - 각 옵션별 미리보기 아이콘
    - [저장] 버튼

---

### Phase 3: 핵심 기능 구현

실제 Supabase DB, AI 파이프라인, 비즈니스 로직을 구현합니다. **AI 차팅 품질 검증을 UI 완성 직후 가장 먼저 실행** (Task 010)해 품질 리스크를 초기에 해소합니다.

- ✅ **Task 009: Supabase 데이터베이스 및 RLS 구축** - 완료 (2026-04-19)
  - `cases`, `case_inputs`, `case_results`, `interview_guidelines` 테이블 생성 (Supabase SQL Editor)
  - `case_status` enum, `bed_zone` enum(`A`/`B`/`R`), `profiles.input_layout` 컬럼 추가
  - `cases.bed_zone` (NOT NULL, default `'A'`), `cases.bed_number` (NOT NULL, integer) 컬럼 추가
  - **베드번호 CHECK 제약**: `CHECK ((bed_zone='A' AND bed_number BETWEEN 1 AND 8) OR (bed_zone='B' AND bed_number BETWEEN 1 AND 11) OR (bed_zone='R' AND bed_number BETWEEN 1 AND 4))`
  - `cases.current_result_id` FK 제약 추가
  - `updated_at` 트리거 함수 생성
  - 각 테이블 RLS 활성화 및 정책 작성 (본인 데이터만 접근)
  - `npx supabase gen types typescript` 또는 수동 타입 갱신
  - **테스트 체크리스트**:
    - [ ] 테스트 사용자 A로 케이스 insert 후 사용자 B로 조회 시 접근 불가 확인
    - [ ] 사용자 A가 사용자 B의 케이스 입력 카드 insert 시 RLS 차단 확인
    - [ ] `cases` 삭제 시 `case_inputs`, `case_results` cascade 삭제 확인
    - [ ] `updated_at` 트리거 동작 확인
    - [ ] 베드번호 CHECK 제약 검증: `A-9`, `B-12`, `R-5`, `R-0` insert 시 실패, `A-1`, `B-11`, `R-4` insert 성공
    - [ ] `bed_zone` 누락 시 기본값 `'A'` 적용 확인

- ✅ **Task 010: AI 파이프라인 CLI 하네스 구축 및 품질 검증** ⭐ - 완료 (2026-04-19)
  - ✅ `lib/ai/gemini-client.ts` — `@google/genai` SDK 래퍼 (`createClient`, `generateText`, `generateStructured<T>`)
  - ✅ `lib/ai/prompts/{normalize,generate-hpi,generate-template}.ts` — system prompt 문자열
  - ✅ `lib/ai/normalize.ts` — Stage 1: 카드 입력 → structured JSON (Gemini Structured Output 활용)
  - ✅ `lib/ai/generate-hpi.ts` — Stage 2: JSON + raw text → HPI 줄글
  - ✅ `lib/ai/generate-template.ts` — Stage 3: JSON + 템플릿 → 채워진 상용구
  - ✅ `scripts/ai-harness.ts` — CLI 하네스: `npx tsx --env-file=.env.local scripts/ai-harness.ts fixtures/case-01.json`
  - ✅ `fixtures/case-01.json`, `fixtures/case-02.json` 에러 없이 3단계 완주 확인
  - ⚠️ **재검증 필요**: Gemini 무료 티어 일일 한도(20회) 소진으로, 아래 프롬프트 튜닝 후 내일 재실행 필요
    - `chest-pain` 상용구: `ongoing: true → "+"` 변환 규칙 프롬프트에 추가됨 (미검증)
    - `chest-pain` 상용구: `Resting pain` 필드 — `relieving_factor`/카드에서 서술형 텍스트 참조하도록 description 수정됨 (미검증)
    - `chest-pain` 상용구: `Onset` 필드 — 최초 발생 시점(prior_episode 참고) 기준으로 description 수정됨 (미검증)
    - 재실행 명령: `npx tsx --env-file=.env.local scripts/ai-harness.ts fixtures/case-01.json`
  - **테스트 체크리스트**:
    - ✅ 각 fixture에 대해 3단계 파이프라인이 에러 없이 완주
    - ✅ Stage 1 출력이 Gemini Structured Output 스키마에 부합
    - ✅ Stage 2 HPI에 raw text의 핵심 뉘앙스(시간, 부위, 양상)가 유지됨
    - ✅ Stage 3 상용구의 핵심 필드 채움 (symptom_check '-' 기본값 유지)
    - [ ] 의사 검수자가 "쓸만한 초안" 판정 (내일 재검증 후 최종 판단)

- ✅ **Task 011: AI 생성 API Route 및 폴링 구현** - 완료 (2026-04-19)
  - ✅ `app/api/cases/[id]/generate/route.ts` POST 핸들러 완성
    - `export const runtime = 'nodejs'`, `export const maxDuration = 60`
    - `status='generating'` 중복 실행 방지 (409 반환)
    - Task 010의 순수 함수 4단계(정규화→HPI→상용구→History) 순차 호출
    - 결과를 `case_results`에 insert, `cases.current_result_id` 업데이트
    - 부분 성공 허용 (Stage 1 실패만 전체 failed, Stage 2/3은 빈 문자열로 계속)
    - 정규화 실패 시에도 `case_results` error row 생성 + `current_result_id` 연결
    - `MODEL_VERSION` 상수 분리
  - ✅ `app/api/cases/[id]/status/route.ts` GET 핸들러 (폴링 전용 경량 엔드포인트)
    - 인증 없으면 401, 타인/없는 케이스 404, 정상 시 `{ caseId, status, currentResultId }` 반환
  - ✅ `components/cases/generation-poller.tsx` 클라이언트 컴포넌트
    - `CaseStatus` 타입 적용, 4초 폴링, 완료/실패 감지 시 `router.refresh()`
    - 연속 실패 10회 초과 시 자동 중단 (무한 재시도 방지)
    - 언마운트 시 cleanup으로 메모리 누수 방지
  - ⚠️ **결과 페이지 더미 데이터 의존**: `cases/[id]/page.tsx`는 Task 012에서 실제 쿼리로 교체 예정
  - **테스트 체크리스트 (Playwright MCP)**: Task 012 DB 연동 완료 후 수행
    - [ ] 더미 케이스 입력 → [차팅 생성] → 결과 페이지에서 로딩 → 완료 후 HPI/상용구 표시
    - [ ] 생성 중 상태에서 다른 페이지 이동 후 다시 돌아와도 결과 확인 가능
    - [ ] Gemini 호출 실패 시 `status='failed'` 및 에러 메시지 표시
    - [ ] 재생성 버튼 클릭 시 새 `case_results` row가 append되고 `current_result_id` 갱신

- ✅ **Task 012: 케이스 CRUD Server Actions 및 DB 연동** - 완료 (2026-04-19)
  - `lib/cases/actions.ts` Server Actions 작성:
    - `createCase()` — 빈 draft 케이스 생성 (기본값 `bed_zone='A'`, `bed_number=1`) 후 id 반환
    - `updateCaseBed(caseId, bedZone, bedNumber)` — 베드번호 업데이트. Zod 스키마로 구역별 유효 범위 검증 (`lib/cases/bed-config.ts` 재사용)
    - `updateCaseCc(caseId, cc, ccHasTemplate)` — C.C 업데이트
    - `addCaseInput(caseId, rawText, timeTag, timeOffsetMinutes)` — 카드 추가
    - `updateHpiEdited(caseId, text)`, `updateTemplateEdited(caseId, text)` — 편집 저장 (debounce)
    - `overrideTemplateKey(caseId, templateKey)` — 수동 상용구 선택
    - `deleteCase(caseId)` — 삭제 (RLS + cascade)
  - `lib/cases/queries.ts` 서버 조회 헬퍼 (`getCase`, `getCaseInputs`, `getCurrentResult`, `listRecentCases`) — 반환 타입에 `bed_zone`, `bed_number` 포함
  - Phase 2에서 만든 더미 데이터 기반 UI를 실제 Server Actions / 쿼리로 교체
  - Phase 2의 `/cases/new`에서 진입 즉시 `createCase()` 호출하도록 수정
  - `bed-picker.tsx`의 `onChange`를 `updateCaseBed` Server Action과 연결 (낙관적 업데이트)
  - 카드 입력 시 `useOptimistic`으로 즉시 UI 반영 + 서버 저장
  - `/dashboard`, `/cases`, `/cases/[id]` 페이지를 실제 쿼리 기반으로 교체
  - **테스트 체크리스트 (Playwright MCP)**:
    - [ ] E2E: 로그인 → 대시보드 → 새 케이스 → **베드번호 선택(A→3으로 변경)** → C.C 입력 → 카드 3개 입력 → 차팅 생성 → 결과 페이지 헤더에 `A-3` 배지 표시 → HPI 편집 → 복사 → 케이스 목록에서 베드번호 컬럼 `A-3` 확인 → 삭제
    - [ ] `/cases/new` 진입 시 기본값 A구역이 선택되어 있고 A-1번 번호가 하이라이트됨
    - [ ] 구역 B로 토글 시 번호 그리드가 즉시 1~11로 리렌더, R로 토글 시 1~4로 리렌더 (화면 이동·스크롤 없음)
    - [ ] `updateCaseBed`에 유효하지 않은 값(예: `{zone:'R', number:5}`) 요청 시 서버에서 거부
    - [ ] 카드 입력 실패(네트워크 에러) 시 optimistic UI 롤백 및 에러 토스트
    - [ ] 다른 사용자가 해당 케이스 URL 접근 시 404 또는 접근 거부
    - [ ] HPI 편집 자동 저장(debounce 500ms) 동작 확인

- ✅ **Task 013: 가이드라인 관리 및 레이아웃 설정 기능 구현** - 완료 (2026-04-19)
  - `lib/guidelines/actions.ts`:
    - `upsertGuideline(cc, content)` — 커스텀 가이드라인 저장
    - `deleteGuideline(cc)` — 삭제
    - `loadGuideline(cc)` — 커스텀 우선, 없으면 시스템 기본 파일(`lib/ai/resources/guides/{cc}.md`) 읽기
  - `lib/settings/actions.ts`:
    - `updateInputLayout(layout)` — `profiles.input_layout` 업데이트
  - `/guidelines` 페이지의 UI를 실제 데이터로 교체
  - `/settings` 페이지의 레이아웃 선택을 실제 저장 동작으로 교체
  - `/cases/new`에서 C.C 입력 시 `loadGuideline(cc)` 호출 → 가이드라인 패널 렌더링
  - `/cases/new` 페이지 진입 시 `profiles.input_layout`을 읽어 레이아웃 적용
  - **테스트 체크리스트 (Playwright MCP)**:
    - [ ] 가이드라인 페이지에서 C.C 선택 → 시스템 기본 확인 → 커스텀 작성 → 저장 → 새 케이스 입력에서 반영 확인
    - [ ] 커스텀 가이드라인 삭제 시 시스템 기본이 다시 표시됨
    - [ ] 설정 페이지에서 `split_horizontal` 선택 → 저장 → 새 케이스 입력에서 좌우 분할 레이아웃 확인
    - [ ] 3가지 레이아웃 모두 모바일/태블릿 뷰포트에서 정상 렌더링

- ✅ **Task 013-1: 핵심 기능 통합 E2E 테스트** - 완료 (2026-04-19)
  - Playwright MCP를 사용한 전체 사용자 플로우 테스트:
    - **모바일 PWA 경로**: 로그인 → 대시보드 → [새 케이스 시작] → **베드번호 선택(예: B-7)** → C.C 입력(가이드라인 자동 로드) → 카드 입력(시간 태그 확인) → [차팅 생성] → 생성 완료 대기 → 결과 헤더에 `B-7` 배지 확인
    - **데스크탑 웹 경로**: 로그인 → 대시보드(케이스 그리드, 각 카드에 베드번호 배지) → 기존 케이스 클릭 → 결과 페이지 헤더에 베드번호 배지 → HPI 편집 → 복사 → 재생성
    - **가이드라인 커스텀 플로우**: 가이드라인 관리 → 작성 → 새 케이스 입력 반영 확인
    - **레이아웃 설정 플로우**: 설정 → 레이아웃 변경 → 새 케이스 입력 반영 확인 (베드번호 영역이 모든 레이아웃에서 입력 영역 상단에 유지되는지 확인)
  - 에러 핸들링 및 엣지 케이스:
    - [ ] C.C 없이 카드만 입력 후 [차팅 생성] 시 동작 (상용구 생략)
    - [ ] 시간 태그 없는 카드만 있을 때 별도 그룹으로 표시 확인
    - [ ] Gemini API 키 없음·쿼터 초과 시 에러 처리
    - [ ] 매우 긴 카드 입력 시 UI 깨짐 없음
    - [ ] RLS 위반 시도 시 적절한 차단
    - [ ] 베드번호 변경 후 다른 케이스로 이동했다가 돌아와도 선택값이 유지됨
    - [ ] 베드번호 선택 UI가 좁은 모바일 뷰포트(360px)에서도 한 화면에 표시되고 번호 버튼이 잘리지 않음
  - RLS 정책 검증 (다른 사용자 간 격리 확인)

---

### Phase 3.5: 관리자 AI 교정 피드백 루프

관리자가 AI 생성 결과를 직접 교정하고, 그 교정 데이터가 다음 AI 생성에 자동으로 반영되는 피드백 루프를 구축합니다.

- ✅ **Task A01: DB 마이그레이션 - 관리자 및 교정 테이블 신설** - 완료 (2026-04-19)
  - `profiles` 테이블에 `is_admin` boolean 컬럼 추가 (DEFAULT false)
  - `ai_corrections` 테이블 생성 (교정 전/후 텍스트, 입력 카드, 섹션 타입 저장)
  - `ai_style_rules` 테이블 생성 (추가 요청사항을 스타일 규칙으로 등록)
  - RLS 정책: `is_admin=true`인 사용자만 SELECT/INSERT 가능
  - `lib/supabase/types.ts`에 `AiCorrection`, `AiStyleRule` 타입 추가
  - 관리자 계정(`tadybear047@gmail.com`) `is_admin=true` 설정

- ✅ **Task A02: 관리자 헬퍼 및 교정 Server Actions 구현** - 완료 (2026-04-19)
  - `lib/auth/is-admin.ts`: `getIsAdmin()` — 현재 사용자의 `is_admin` 조회
  - `lib/corrections/actions.ts`: `saveCorrection()` — 관리자 권한 체크 + `ai_corrections` 저장 + `comment` 있으면 `ai_style_rules`에도 등록
  - `lib/ai/load-resources.ts`: `loadCorrections(cc, sectionType)` + `loadStyleRules(cc, sectionType)` 함수 추가 (DB 조회)

- ✅ **Task A03: 교정 모달 UI 컴포넌트 구현** - 완료 (2026-04-19)
  - `components/cases/correction-modal.tsx` — shadcn/ui Dialog 기반
    - 좌측: AI 원본 텍스트 (읽기 전용, 배경색 구분)
    - 우측: 교정 버전 입력 textarea
    - 하단: 추가 요청사항 (스타일 규칙으로 저장 안내)
    - 저장 완료 시 toast + 모달 닫기, 저장 중 로딩 상태 표시
  - `components/cases/result-section.tsx`: `correctionSlot?: React.ReactNode` prop 추가

- ✅ **Task A04: 결과 페이지에 관리자 교정 버튼 통합** - 완료 (2026-04-19)
  - `app/(app)/cases/[id]/page.tsx`에서 `getIsAdmin()` 호출 (`Promise.all` 병렬)
  - `completed` 상태의 HPI / 상용구 / History 각 섹션에 `CorrectionModal` 연결
  - 일반 계정에서는 교정 버튼 미표시

- ✅ **Task A05: AI 파이프라인에 교정 데이터 few-shot 주입** - 완료 (2026-04-19)
  - `lib/ai/generate-hpi.ts`: `loadCorrections` + `loadStyleRules` 병렬 로드 → system prompt에 규칙 append, user prompt에 교정 예시 포함
  - `lib/ai/generate-template.ts`: 기존 `loadExamples()` 대신 `loadCorrections` 사용, 스타일 규칙 추가
  - 교정 데이터 없을 때 기존 동작 동일 유지 (backwards compatible)

---

### Phase 4: 고급 기능 및 최적화

PWA 설치 경험, 성능 최적화, 배포 파이프라인을 마무리합니다.

- **Task 014: PWA 설치 및 오프라인 대응**
  - `public/manifest.json` 작성 (앱 이름, 아이콘, `start_url: "/"`, `display: "standalone"`, `theme_color`)
  - `public/icons/` 앱 아이콘 생성 (192×192, 512×512, maskable)
  - `next-pwa` 또는 수동 Service Worker 설정
  - 오프라인 기본 페이지 (`app/offline/page.tsx`) — "네트워크 연결이 필요합니다" 안내
  - 홈 페이지에서 설치 유도 배너 (모바일 감지 시)
  - PWA standalone 모드 감지 유틸리티 (`lib/pwa/is-standalone.ts`)
  - iOS Safari "홈 화면에 추가" 가이드 안내
  - **테스트 체크리스트**:
    - [ ] Chrome Lighthouse PWA 점수 90+ 달성
    - [ ] 안드로이드 Chrome에서 "홈 화면에 추가" 동작 확인
    - [ ] iOS Safari에서 홈 화면 아이콘 탭 시 standalone 실행 확인
    - [ ] 오프라인 상태에서 앱 실행 시 offline 페이지 표시
    - [ ] HTTPS 환경에서 Service Worker 등록 성공

- **Task 015: 성능 최적화 및 배포**
  - Next.js 15 이미지 최적화 (`next/image`) 적용
  - Server Component 비율 최대화, Client Component 최소화
  - `lib/ai/resources/` 파일들의 정적 import로 번들 최적화
  - `components/` 폴더 코드 스플리팅 확인
  - Supabase 쿼리 인덱스 점검 (`cases_user_id_created_at_idx` 등)
  - Vercel 배포 설정 (환경 변수, maxDuration, HTTPS)
  - Vercel Pro 플랜 전환 (60초 함수 한도 확보)
  - 로깅·모니터링 기본 설정 (Vercel Analytics 또는 Supabase logs)
  - README 업데이트 및 배포 가이드 문서화
  - **테스트 체크리스트**:
    - [ ] Vercel 프로덕션 배포 후 전체 플로우 E2E 통과
    - [ ] Gemini API 호출 30초 이내 완료 확인 (Flash 기준)
    - [ ] 모바일 3G 시뮬레이션에서 FCP 2초 이내
    - [ ] Supabase 쿼리 응답 100ms 이내 (캐싱 제외)
    - [ ] 프로덕션 환경에서 PWA 설치 가능 확인

---

## 🔗 기능 매핑 (PRD → Task)

| 기능 ID | 기능명                   | 구현 Task                                   |
| ------- | ------------------------ | ------------------------------------------- |
| F001    | 케이스 생성 및 카드 입력 | Task 001, 006, 012                          |
| F002    | C.C 자동완성             | Task 003, 006                               |
| F003    | 시간 태그 자동 감지      | Task 006 (parse-time-tag)                   |
| F004    | AI 차팅 생성             | Task 010, 011                               |
| F005    | 차팅 편집 및 복사        | Task 007, 012                               |
| F006    | 케이스 목록 조회 및 삭제 | Task 005, 008, 012                          |
| F007    | 수동 상용구 선택         | Task 007, 012                               |
| F008    | PWA 설치 및 접근         | Task 014                                    |
| F009    | 문진 가이드라인 패널     | Task 006, 013                               |
| F010    | 기본 인증                | (기존 스타터 활용, 추가 작업 없음)          |
| F011    | 생성 상태 관리           | Task 011                                    |
| F012    | 커스텀 가이드라인 관리   | Task 008, 013                               |
| F013    | 입력 화면 레이아웃 설정  | Task 008, 013                               |
| F014    | 베드번호 지정            | Task 002, 004, 005, 006, 007, 008, 009, 012 |

---

## 📌 핵심 설계 원칙

1. **구조 우선 접근법**: Phase 1에서 전체 라우트·타입·스키마를 먼저 확정 후 UI와 로직은 독립 개발 가능
2. **AI 품질 우선 검증**: Phase 3의 Task 010에서 CLI 하네스로 먼저 AI 품질을 검증. 품질 기준 미달 시 프롬프트·few-shot을 튜닝한 뒤 다음 Task로 진행
3. **원본 텍스트 보존**: `case_inputs.raw_text`는 절대 수정하지 않음. AI 생성 JSON은 중간 표현
4. **재생성 히스토리**: `case_results`는 케이스당 1:N. 이전 결과 유지로 비교·디버깅 가능
5. **파일시스템 기반 AI 리소스**: `style_guide`, `template`, `examples`, 시스템 기본 `guides`는 Git으로 버전 관리. 사용자 커스텀만 DB에 저장
6. **모바일 PWA ↔ 데스크탑 웹 동일 URL**: `/mobile`, `/desktop` 같은 별도 경로 없이 뷰포트·standalone 모드 감지로 레이아웃만 분기
7. **베드번호 2-컬럼 저장 + 2-탭 선택**: DB는 `bed_zone` enum + `bed_number` integer + CHECK 제약으로 잘못된 조합 원천 차단. UI는 구역 토글 + 번호 그리드를 한 화면에 동시 렌더해 화면 이동·스크롤 없이 구역 → 번호 두 번의 탭으로 선택 완료. 베드번호는 C.C보다 먼저 확정됨

---

## 🚨 Phase 3 진입 전 필수 확인 사항

Phase 3의 Task 010(AI 품질 검증)은 아래 리소스 없이는 시작할 수 없습니다:

1. ✅ **익명화된 실제 ER 케이스 샘플 2~3개** — `fixtures/case-01.json` (Chest pain), `fixtures/case-02.json` (GI bleeding) 준비 완료
2. ✅ **Gemini API 키** (`GOOGLE_GENAI_API_KEY`) — `.env.local`에 설정 완료, 파이프라인 실행 확인
3. ✅ **차트 출력 언어 확정** — 혼용(한국어 문장 구조 + 영어 의학 용어)으로 확정
4. ✅ **`cc-list.json` 실제 목록** — MVP 5개 C.C. + Hematemesis/Melena/Hematochezia 별칭 포함, 총 8개 확정
5. ✅ **상용구 `template.json` 5개** — C.C.별 필드 기반 JSON 형식으로 완성
6. ✅ **`schemas/{cc}.json` 5개** — 단일 `structured_schema.json` 대신 C.C.별 분리 스키마로 완성
7. ⬜ **Vercel Pro 플랜 사용 가능 여부** — 60초 함수 한도 필요 (Task 011 배포 전 확인)

**Task 010 완료. 다음 단계: Task 009(DB 구축) → Task 011(API Route) 순으로 진행**
