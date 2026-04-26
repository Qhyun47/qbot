# 규봇 MVP PRD

## 핵심 정보

**목적**: 응급실 의사가 모바일로 문진 정보를 입력하면 AI가 차팅 초안 3종(HPI 줄글 + C.C 상용구 + History)을 자동 생성해주는 어시스턴트
**사용자**: 모바일로 문진하고 데스크탑으로 차트를 작성하는 응급의학과 의사

---

## 사용자 여정

| 경로                        | 진입                 | 흐름                                                                                                                       |
| --------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **모바일 PWA** (문진 입력)  | 홈 화면 앱 아이콘 탭 | 대시보드 → [새 케이스 시작] → 베드번호 선택 → C.C 입력 → 카드 입력 → [차팅 생성] → 결과 페이지 (폴링 대기, 앱 닫아도 무관) |
| **데스크탑 웹** (결과 확인) | 브라우저 접속        | 대시보드 케이스 그리드 → 케이스 클릭 → 결과 확인 → 편집 → 복사 → EMR 붙여넣기                                              |

---

## 기능 명세

### MVP 핵심 기능

| ID       | 기능명                   | 설명                                                                                                                                               |
| -------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F001** | 케이스 생성 및 카드 입력 | 새 케이스 생성 + 자유 텍스트 카드 입력, 입력 즉시 저장                                                                                             |
| **F002** | C.C 자동완성             | 사전 정의 목록에서 자동완성, 상용구 존재 여부 배지 표시                                                                                            |
| **F003** | 시간 태그 자동 감지      | "3일 전" 등 상대 시간 감지 → 카드 배지 부착 및 시간 순 정렬                                                                                        |
| **F004** | AI 차팅 생성             | 입력 카드 → 4단계(정규화→HPI→상용구→History) 처리 → 초안 3종 생성. 각 카드가 어느 섹션에 해당하는지 AI가 판단 (한 카드가 복수 섹션에 속할 수 있음) |
| **F005** | 차팅 편집 및 복사        | HPI/상용구/History 편집 + 독립 복사 버튼                                                                                                           |
| **F006** | 케이스 목록 조회·삭제    | 날짜·C.C·상태별 목록, 삭제                                                                                                                         |
| **F007** | 수동 상용구 선택         | C.C 목록 외일 때 다른 상용구 템플릿 수동 선택                                                                                                      |
| **F008** | PWA 설치 및 접근         | 홈 화면 설치, standalone 전체화면 실행                                                                                                             |
| **F009** | 문진 가이드라인 패널     | 입력 화면 옆/아래에 C.C별 가이드라인 표시 (커스텀 우선, 없으면 시스템 기본)                                                                        |
| **F014** | 베드번호 지정            | A/B/R 구역 토글 + 번호 그리드, 한 화면 2-탭으로 완료. C.C보다 먼저 지정                                                                            |

### MVP 지원 기능

| ID       | 기능명                  | 설명                                                             |
| -------- | ----------------------- | ---------------------------------------------------------------- |
| **F010** | 기본 인증               | 이메일/비밀번호 + Google OAuth + 로그아웃                        |
| **F011** | 생성 상태 관리          | 생성 중/완료/실패 표시, 폴링으로 완료 자동 감지                  |
| **F012** | 커스텀 가이드라인 관리  | C.C별 Markdown 가이드라인 업로드·수정·삭제                       |
| **F013** | 입력 화면 레이아웃 설정 | 단독 / 상하 분할 / 좌우 분할 선택 (`profiles.input_layout` 저장) |

### MVP 이후 제외

음성 STT, 이미지 첨부, 팀/병원 멀티 계정, 오프라인 지원, 알림, 재생성 이력 비교 UI

---

## 메뉴 구조

```
공개: 홈 / 로그인 / 회원가입

모바일 PWA (로그인 후):
  대시보드 — [새 케이스 시작] CTA(상단 대형) + 최근 케이스 3개
  케이스 목록 / 가이드라인 관리 / 설정 / 로그아웃

데스크탑 웹 (로그인 후):
  대시보드 — 케이스 그리드(중앙 주영역) + [+새 케이스](우측 상단)
  케이스 목록 / 가이드라인 관리 / 설정 / 로그아웃
```

> PWA `start_url: "/"` → 로그인 감지 시 `/dashboard` 자동 이동. `/dashboard`는 뷰포트/standalone 감지로 레이아웃 분기.

---

## 페이지별 상세 기능

### 홈 페이지

랜딩 전용. 로그인된 사용자 → `/dashboard` 자동 리다이렉트. 비로그인 → 로그인/회원가입 버튼 표시.

### 로그인 / 회원가입 페이지 (F010)

이메일+비밀번호 폼, Google OAuth 버튼. 성공 시 대시보드로 이동.

### 대시보드 페이지 (F001, F006, F008, F014)

- **모바일**: 상단 대형 [새 케이스 시작] + 최근 케이스 3개 카드(베드번호 배지·C.C·상태)
- **데스크탑**: 최근 케이스 그리드(베드번호 배지 포함) + 우측 상단 [+새 케이스]

### 새 케이스 입력 페이지 (F001~F004, F009, F014)

진입 즉시 draft 케이스 생성(기본값 A-1 preset).

**베드번호 선택 영역** (최상단 고정, F014)

- 구역 토글 `[A]` `[B]` `[R]` → 번호 그리드(A:1~8 / B:1~11 / R:1~4) 즉시 전환
- 선택 완료 배지(예: `A-3`) 상단 고정 표시
- 화면 이동·스크롤 없이 2-탭으로 완료

**입력 영역** (항상 표시)

- C.C 자동완성 + 상용구 존재 배지 (F002)
- 카드 타임라인(최신이 위, 시간 태그 배지, 시간 순 정렬, 태그 없는 카드 별도 그룹) (F001, F003)
- 하단 고정 입력창 + Enter 전송, 입력 즉시 저장 (F001)
- [차팅 생성] 버튼 → 케이스 결과 페이지로 이동 (F004)

**가이드라인 패널** (설정에 따라, F009)

- C.C 입력 시 해당 가이드라인 자동 로드 (커스텀 우선, 없으면 시스템 기본)
- Markdown 렌더링, 패널 내 스크롤

**분할 레이아웃** (F013 설정값 적용)

- `single`: 입력 영역 전체 화면
- `split_vertical`: 상단 가이드 / 하단 입력
- `split_horizontal`: 좌측 입력 / 우측 가이드 (폴드·태블릿용)

### 케이스 결과 페이지 (F004, F005, F007, F011, F014)

- 헤더: **베드번호 배지** + C.C + 생성 상태 배지
- 생성 중: 로딩 + 3~5초 폴링 → 완료 시 자동 갱신
- HPI 섹션: 편집 가능 textarea + 자동 저장 + 복사 버튼
- 상용구 섹션: 동일 구조. 없는 C.C는 수동 상용구 선택 드롭다운(F007)
- History 섹션: 편집 가능 textarea + 자동 저장 + 복사 버튼. AI가 생성한 Past/Med/Op Hx. (내용 없으면 `-`로 표기) + Family Hx. (내용 있을 때만 표시)
- 원본 카드 타임라인(읽기 전용), [재생성] 버튼, 실패 시 에러 + [재시도]

### 케이스 목록 페이지 (F006, F014)

최근 50개. 컬럼: **베드번호** · 날짜 · C.C · 상태 배지 · 삭제(확인 모달). 행 클릭 → 결과 페이지.

### 가이드라인 관리 페이지 (F012)

C.C 드롭다운 선택 → 시스템 기본 미리보기(읽기 전용) + 커스텀 Markdown 편집 → 저장/삭제. 커스텀 목록 표시.

### 설정 페이지 (F013)

입력 화면 레이아웃 라디오 선택(단독/상하분할/좌우분할) + 미리보기 아이콘 → 저장 → `profiles.input_layout` 업데이트.

---

## 데이터 모델

### cases

| 필드                    | 타입/관계                               |
| ----------------------- | --------------------------------------- |
| id                      | UUID                                    |
| user_id                 | → profiles.id                           |
| bed_zone                | enum(A/B/R), default A                  |
| bed_number              | integer, CHECK 제약                     |
| cc                      | text (nullable)                         |
| cc_has_template         | boolean                                 |
| template_key            | text (nullable)                         |
| status                  | enum(draft/generating/completed/failed) |
| current_result_id       | → case_results.id (nullable)            |
| created_at / updated_at | timestamptz                             |

> **CHECK**: `(bed_zone='A' AND bed_number BETWEEN 1 AND 8) OR (bed_zone='B' AND bed_number BETWEEN 1 AND 11) OR (bed_zone='R' AND bed_number BETWEEN 1 AND 4)`

### case_inputs

| 필드                | 타입/관계                     |
| ------------------- | ----------------------------- |
| id                  | UUID                          |
| case_id             | → cases.id                    |
| raw_text            | text (수정 불가)              |
| time_tag            | text (nullable, 예: "3일 전") |
| time_offset_minutes | integer (nullable, 정렬용)    |
| display_order       | integer                       |
| created_at          | timestamptz                   |

### case_results

| 필드                             | 타입/관계             |
| -------------------------------- | --------------------- |
| id                               | UUID                  |
| case_id                          | → cases.id            |
| structured_json                  | jsonb                 |
| hpi_draft / hpi_edited           | text / text(nullable) |
| template_draft / template_edited | text / text(nullable) |
| history_draft / history_edited   | text / text(nullable) |
| template_key_used                | text                  |
| model_version                    | text                  |
| error_message                    | text (nullable)       |
| generated_at                     | timestamptz           |

> **history_draft 형식**: `Past Hx. : ...`, `Med Hx. : ...`, `Op Hx. : ...` 는 항상 포함 (내용 없으면 `(-)`). `Family Hx. : ...` 는 내용이 있을 때만 포함.

### interview_guidelines

| 필드                    | 타입/관계                                  |
| ----------------------- | ------------------------------------------ |
| id                      | UUID                                       |
| user_id                 | → profiles.id (nullable, null=시스템 기본) |
| cc                      | text                                       |
| content                 | text (Markdown)                            |
| created_at / updated_at | timestamptz                                |

> 시스템 기본 가이드라인은 `lib/ai/resources/guides/{cc}.md` 파일로 관리. `interview_guidelines` 테이블에는 사용자 커스텀만 저장.

### profiles

| 필드                   | 타입/관계                                                    |
| ---------------------- | ------------------------------------------------------------ |
| id                     | UUID (auth.uid)                                              |
| full_name / avatar_url | text                                                         |
| input_layout           | enum(single/split_vertical/split_horizontal), default single |
| created_at             | timestamptz                                                  |

---

## 기술 스택

| 영역        | 기술                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| 프레임워크  | Next.js 15 App Router, React 19, TypeScript 5.6+                          |
| 스타일링    | Tailwind CSS v3, shadcn/ui (new-york/neutral), Lucide React               |
| 폼/검증     | React Hook Form 7.x, Zod                                                  |
| 백엔드/DB   | Supabase (Auth + PostgreSQL + RLS)                                        |
| AI          | Google Gemini Flash (`@google/genai`), 리소스 파일: `lib/ai/resources/`   |
| PWA         | `manifest.json` + Service Worker, `start_url: "/"`, `display: standalone` |
| 배포        | Vercel Pro (60초 함수 한도), HTTPS 필수                                   |
| 패키지 관리 | npm                                                                       |

---

## 주요 설계 결정

1. **원본 텍스트 보존**: `case_inputs.raw_text` 절대 수정 금지. 원문이 진실의 원천
2. **재생성 히스토리**: `case_results` 1:N. `cases.current_result_id`로 현재 표시본 지정
3. **AI 3단계 분리**: 정규화 → HPI → 상용구 독립 처리, 단계별 프롬프트 관리
4. **가이드라인 저장 분리**: 시스템 기본은 파일(`lib/ai/resources/guides/{cc}.md`), 커스텀만 DB
5. **레이아웃 설정**: `profiles.input_layout`으로 단순화. 별도 설정 테이블 없음
6. **베드번호 2컬럼 분리**: `bed_zone` enum + `bed_number` integer + CHECK 제약. UI에서 `${zone}-${number}` 조합
7. **베드번호 2-탭 원칙**: 구역 토글 + 번호 그리드를 한 화면에 동시 렌더. 화면 전환/스크롤 없이 완료. C.C보다 먼저 확정
