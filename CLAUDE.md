# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

- PRD 문서: @docs/PRD.md
- 개발 로드맵: @docs/ROADMAP.md

## 개발 명령어

```bash
npm run dev      # 개발 서버 실행 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

## 환경 변수 설정

`.env.local` 파일에 다음 변수가 필요합니다:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`lib/utils.ts`의 `hasEnvVars`로 환경변수 설정 여부를 확인하며, 미설정 시 인증 미들웨어가 우회됩니다.

## 프로젝트 구조 및 아키텍처

Next.js 15 App Router + Supabase 인증 스타터 킷입니다.

### 인증 흐름

- `proxy.ts` (루트): Next.js 미들웨어 진입점. 모든 요청을 `lib/supabase/proxy.ts`의 `updateSession`으로 전달합니다.
- `lib/supabase/proxy.ts`: Supabase 세션 갱신 및 인증 보호 로직. `/` 경로와 `/auth/*` 경로를 제외한 모든 미인증 요청을 `/auth/login`으로 리다이렉트합니다.
- `app/auth/`: 로그인, 회원가입, 비밀번호 재설정, 이메일 확인 등 인증 관련 페이지 모음입니다.
- `app/protected/`: 인증 후에만 접근 가능한 보호된 영역입니다.

### 핵심 규칙

**Server Component 우선**: `'use client'`는 상태(`useState`)나 브라우저 이벤트가 필요한 경우에만 사용합니다.

**Next.js 15 async params**: `params`와 `searchParams`는 반드시 `await`해서 사용합니다.

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
}
```

**Supabase 클라이언트**: 요청마다 새로운 클라이언트 인스턴스를 생성합니다. 전역 변수에 저장하지 않습니다.

**경로 별칭**: 상대 경로 대신 반드시 `@/` 별칭을 사용합니다.

```tsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
```

### UI 컴포넌트

- `components/ui/`: shadcn/ui 기반 기본 컴포넌트 (스타일: `new-york`, 색상: `neutral`)
- shadcn 컴포넌트 추가: `npx shadcn@latest add [component-name]`
- 스타일링: Tailwind CSS + `cn()` 유틸리티 함수 (`clsx` + `tailwind-merge`)
- 아이콘: `lucide-react`

### 파일 네이밍 규칙

- 파일명: `kebab-case` (예: `user-profile.tsx`)
- 컴포넌트명: `PascalCase` (예: `export function UserProfile()`)
- 폴더명: `kebab-case` 또는 소문자

## 가이드 문서

`docs/guide/` 폴더에 상세 개발 가이드가 있습니다:

- `nextjs-15.md`: Next.js 15 필수 규칙 및 새 기능
- `component-patterns.md`: 컴포넌트 설계 패턴
- `project-structure.md`: 폴더 구조 및 네이밍 컨벤션
- `styling-guide.md`: Tailwind CSS 스타일링 가이드
- `forms-react-hook-form.md`: 폼 처리 패턴

## AI 리소스 규칙 (`lib/ai/resources/`)

### C.C. (Chief Complaint) 표기 규칙

- **`cc` 필드**: Sentence case 적용 — 첫 단어의 첫 글자만 대문자, 나머지는 소문자
  - ✅ `"Chest pain"`, `"Abdominal pain"`, `"GI bleeding"`
  - ❌ `"Chest Pain"`, `"Abdominal Pain"`, `"GI Bleeding"` (Title Case 금지)
- **예외**: 의학 약어/두문자어는 원형 그대로 유지
  - ✅ `"GI bleeding"` (GI는 약어이므로 대문자 유지)
  - ✅ `"IV access problem"` (IV는 약어)
- **`templateKey` 필드**: 반드시 영어 kebab-case — 파일명으로 직접 사용됨
  - ✅ `"chest-pain"`, `"gi-bleeding"`
- **출력 언어**: 혼용 (한국어 문장 구조 + 영어 의학 용어)

## AI 리소스 추가 워크플로우

사용자가 C.C., 가이드라인, 상용구, 케이스 예시 데이터를 추가하거나 수정을 요청할 때 아래 절차를 따릅니다.

**C.C. / 가이드라인 / 상용구는 완전히 독립적으로 등록됩니다.** 하나를 등록한다고 다른 것의 등록을 강요하지 않으며, 단순히 커넥션(연결) 여부만 확인합니다.

### 핵심 파일 위치

| 파일                                            | 역할                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `lib/ai/resources/cc-list.json`                 | 정형 C.C. 목록 (단일 소스, `{ cc, guideKeys: [{key, rank}][], templateKeys: [{key, rank}][], aliasOf? }`) |
| `lib/ai/resources/cc-types.ts`                  | `CcConnectionEntry` 타입, `CcListEntry` 인터페이스, 헬퍼 함수                                             |
| `lib/ai/resources/guide-list.json`              | 가이드라인 표시명 목록 (`{ guideKey, displayName }`)                                                      |
| `lib/ai/resources/template-list.json`           | 상용구 표시명 목록 (`{ templateKey, displayName }`)                                                       |
| `ai-docs/guides/{guideKey}/guide.html`          | 시스템 가이드라인 파일 (HWP→HTML, processGuideHtml() 적용 후 저장)                                        |
| `ai-docs/templates/{templateKey}/template.json` | 상용구 템플릿 파일 (`fields`, `pe`, `history` 섹션 포함)                                                  |
| `ai-docs/templates/{templateKey}/schema.json`   | AI 정규화 스키마 파일                                                                                     |
| `ai-docs/templates/{templateKey}/examples.md`   | 케이스 예시 파일 (4섹션 형식: HPI/P.I template/History/P/E)                                               |
| `ai-docs/pending-matches.md`                    | 대기 중인 커넥션 추적 파일 (C.C./가이드라인/상용구 간 4방향)                                              |

---

### 용어 정의

- **HPI**: AI가 줄글로 생성하는 현병력(Present Illness) 서술 영역
- **P.I. template**: 상용구 중 현병력 영역 (`template.json`의 `fields` 섹션 — chest-pain 기준 "NTG response?"로 시작하는 구조화된 필드)
- **상용구**: P.I. template + History + P/E 3개 섹션을 통합하는 단어. `template.json` 파일 전체를 지칭
- **커넥션**: C.C.와 가이드라인/상용구 간의 연결. C.C. 입력 시 연결된 가이드라인/상용구를 자동 추천하는 데 사용

---

### 정형 C.C. 추가 절차

1. `lib/ai/resources/cc-list.json`에 항목 추가:

   ```json
   { "cc": "Dizziness", "guideKeys": [], "templateKeys": [] }
   ```

   - C.C. 표기는 Sentence case (의학 약어 제외), key는 kebab-case
   - `aliasOf`가 있는 C.C.는 직접 커넥션 추가 불가 — 원본 C.C.의 guideKeys/templateKeys를 통해 연결

2. 사용자가 **guideKey** 커넥션을 언급한 경우:
   - `guide-list.json`에 해당 key **존재** → 현재 `guideKeys` 순위 목록 표시 후 순위 질문 → `guideKeys`에 `{ "key": "...", "rank": N }` 형태로 추가 (0순위 충돌 시 기존 0순위를 1순위로 재조정)
   - `guide-list.json`에 해당 key **없음** → 순위 질문 후 `ai-docs/pending-matches.md` 섹션 1(C.C.→가이드라인 대기)에 rank 정보와 함께 기록 (중복 확인 후)

3. 사용자가 **templateKey** 커넥션을 언급한 경우:
   - `template-list.json`에 해당 key **존재** → 현재 `templateKeys` 순위 목록 표시 후 순위 질문 → `templateKeys`에 `{ "key": "...", "rank": N }` 형태로 추가 (0순위 충돌 시 기존 0순위를 1순위로 재조정)
   - `template-list.json`에 해당 key **없음** → 순위 질문 후 `ai-docs/pending-matches.md` 섹션 2(C.C.→상용구 대기)에 rank 정보와 함께 기록 (중복 확인 후)

4. 커넥션 언급이 없으면 pending 기록 없음

5. `ai-docs/pending-matches.md` 섹션 3(가이드라인→C.C. 대기)에서 이 C.C.를 기다리는 항목 조회
   - 있으면: "이 C.C.를 {guideKey} 가이드라인과 연결할까요?" 질문 → 수락/거절 처리

6. `ai-docs/pending-matches.md` 섹션 4(상용구→C.C. 대기)에서 이 C.C.를 기다리는 항목 조회
   - 있으면: "이 C.C.를 {templateKey} 상용구와 연결할까요?" 질문 → 수락/거절 처리

---

### 가이드라인 추가 절차

1. 사용자에게 "HWP에서 내보낸 HTML 전체를 붙여주세요"를 요청한 후, 받은 HTML에 `processGuideHtml()` (`lib/utils/html-utils.ts`)을 적용하여 `ai-docs/guides/{guideKey}/guide.html`로 저장

2. `lib/ai/resources/guide-list.json`에 항목 추가:

   ```json
   { "guideKey": "new-key", "displayName": "Display Name" }
   ```

3. 사용자가 **C.C. 커넥션**을 언급한 경우:
   - `cc-list.json`에 해당 C.C. **존재** → 해당 C.C.의 현재 `guideKeys` 순위 목록 표시 후 순위 질문 → `guideKeys`에 `{ "key": "...", "rank": N }` 형태로 추가 (0순위 충돌 시 기존 0순위를 1순위로 재조정)
   - `cc-list.json`에 해당 C.C. **없음** → 순위 질문 후 `ai-docs/pending-matches.md` 섹션 3(가이드라인→C.C. 대기)에 rank 정보와 함께 기록 (중복 확인 후)
   - 커넥션 언급이 없으면 아무것도 기록하지 않음

4. `ai-docs/pending-matches.md` 섹션 1(C.C.→가이드라인 대기)에서 이 guideKey를 기다리는 C.C. 조회
   - 있으면: "이 가이드라인을 {C.C.}와 연결할까요?" 질문 → 수락/거절 처리

5. **가이드라인 추가 시 케이스 예시 데이터는 불필요** (AI 파이프라인에 직접 영향 없음)

---

### 상용구 추가 절차

1. 아래 파일들을 생성:
   - `ai-docs/templates/{templateKey}/template.json` — 상용구 템플릿 (기존 chest-pain.json 구조 참조)
     - **`fields` 섹션 필수 (P.I. template)**: `fields[]` + `output_example` 구조. 사용자에게 P.I. template 양식을 요청해 입력받아야 함
     - **`history` 섹션 필수**: `fields[]` + `output_example` 구조. 사용자에게 History 양식을 요청해 입력받아야 함
     - **`pe` 섹션 필수**: `fields[]` + `output_example` 구조. 사용자에게 P/E 양식을 요청해 입력받아야 함
   - `ai-docs/templates/{templateKey}/schema.json` — AI 정규화 스키마 (기존 chest-pain.json 구조 참조)

2. `lib/ai/resources/template-list.json`에 항목 추가:

   ```json
   { "templateKey": "new-key", "displayName": "Display Name" }
   ```

3. 사용자가 **C.C. 커넥션**을 언급한 경우:
   - `cc-list.json`에 해당 C.C. **존재** → 해당 C.C.의 현재 `templateKeys` 순위 목록 표시 후 순위 질문 → `templateKeys`에 `{ "key": "...", "rank": N }` 형태로 추가 (0순위 충돌 시 기존 0순위를 1순위로 재조정)
   - `cc-list.json`에 해당 C.C. **없음** → 순위 질문 후 `ai-docs/pending-matches.md` 섹션 4(상용구→C.C. 대기)에 rank 정보와 함께 기록 (중복 확인 후)
   - 커넥션 언급이 없으면 아무것도 기록하지 않음

4. `ai-docs/pending-matches.md` 섹션 2(C.C.→상용구 대기)에서 이 templateKey를 기다리는 C.C. 조회
   - 있으면: "이 상용구를 {C.C.}와 연결할까요?" 질문 → 수락/거절 처리

5. **양식 수집**: 상용구 파일 생성 전 반드시 사용자에게 순서대로 요청:
   1. "이 상용구의 P.I. template 양식(기본값 상태의 출력 포맷)을 알려주세요."
   2. "이 상용구의 History 양식(기본값 상태의 출력 포맷)을 알려주세요."
   3. "이 상용구의 P/E 양식(기본값 상태의 출력 포맷)을 알려주세요."

   **고정 주석 마커(`#`) 규칙**: 사용자가 제공한 양식에 `#`이 있으면 `output_example`에 `#` 포함 상태로 그대로 저장합니다. `#`은 인라인 마커로, `#` 이후 텍스트(줄 끝까지)를 "AI가 수정하지 말 것"을 의미합니다. `#` 이전 텍스트는 그대로 유지됩니다. AI 차팅 생성 및 프론트엔드 미리보기 시에는 `#` 기호만 자동으로 제거됩니다.

   **AI 생성 대체 마커(`$`) 규칙**: 사용자가 제공한 양식에 `$`이 있으면 `output_example`에 `$` 포함 상태로 그대로 저장합니다. `$`는 인라인 마커로, `$text`는 "AI가 이 설명에 맞게 자유 형식으로 채울 것"을 의미합니다. `$` 이전 텍스트는 그대로 유지됩니다. AI 차팅 생성 시 `$text`를 해당 내용으로 대체하며, 정보가 없으면 `$` 기호만 제거하고 원문을 그대로 출력합니다. 프론트엔드 미리보기 시에도 `$` 기호는 자동으로 제거됩니다.

6. **케이스 예시 데이터 요청**: 상용구 추가가 완료되면 반드시 사용자에게 다음을 요청:
   > "AI 차팅 품질 향상을 위해 케이스 예시 데이터가 필요합니다. 아래 형식으로 제공해 주세요. 케이스가 여러 개일수록 AI 품질이 향상됩니다."
   >
   > ```
   > ### 001.
   >
   > (HPI 줄글 예시)
   >
   >
   > (P.I template 실제 출력 예시)
   >
   >
   > (History 실제 출력 예시)
   >
   >
   > (P/E 실제 출력 예시)
   >
   >
   > ---
   >
   > ### 002.
   > ...
   > ```
   >
   > 코드블록 순서: 1번째 = HPI / 2번째 = P.I template / 3번째 = History / 4번째 = P/E

---

### 케이스 예시 데이터 추가 절차

- **명령어**: `/add-example {templateKey}` — 기존 상용구에 예시만 추가하는 전용 명령어
- **저장 위치**: `ai-docs/templates/{templateKey}/examples.md`
- **형식**: `### NNN.` 번호 단위, 4개 코드블록 순서 고정 (1번째 = HPI / 2번째 = P.I template / 3번째 = History / 4번째 = P/E)
- **저장 방법**: 기존 파일이 있으면 append, 없으면 새로 생성
- **10개 초과 시**: Claude가 품질·다양성 기준으로 10개 추천 → 사용자 승인 후 pruning
- **저장 후**: 메타 학습 분석 step 수행 (generate-pi.md 등 4개 프롬프트 파일에서 새 패턴 식별 → 발견 시 변경안 제시)
- **추가 기준**:
  - 상용구(templateKeys)가 있는 C.C.: **필수** (최소 1개)
  - 가이드라인만 있고 상용구 없는 C.C.: 불필요

---

### 커넥션 순위 규칙

- `guideKeys` / `templateKeys`의 각 항목은 `{ "key": "guideKey-or-templateKey", "rank": 0 }` 형태로 저장
- **rank 0**: C.C. 입력 시 해당 가이드라인/상용구 자동 로드. C.C.당 가이드라인 0순위 최대 1개, 상용구 0순위 최대 1개
- **rank 1 이상**: 자동 로드되지 않으며 추천 목록 또는 수동 선택으로만 접근
- **연결이 1개뿐인 경우**: 자동으로 rank 0 동작 (UI/런타임 동작 규칙 — 커넥션 추가 시 순위 질문은 생략하지 않음)
- **0순위 충돌 처리**: 새 항목을 0순위로 지정하면 기존 0순위 항목이 1순위로 자동 재조정 (사용자 확인 후 진행)
- **커넥션 추가 시 반드시 순위 지정**: 기존 연결 목록과 현재 순위를 먼저 보여준 후 새 항목의 순위를 질문

---

### 커넥션 처리 공통 규칙

**수락 시**: `cc-list.json`에서 해당 C.C.의 `guideKeys` 또는 `templateKeys` 업데이트 + `ai-docs/pending-matches.md` 해당 행 삭제

**거절 시**: `ai-docs/pending-matches.md` 해당 행 삭제만 (재연결 필요 시 수동 처리)

**중복 방지**: pending 기록 전 동일 (C.C., key) 쌍이 이미 해당 섹션에 존재하는지 확인

**리소스 삭제 시**:

- 가이드라인 삭제 → `guide-list.json`에서 제거 + `cc-list.json`의 모든 `guideKeys`에서 해당 key 제거 + `ai-docs/guides/{guideKey}/` 폴더 삭제 + `ai-docs/pending-matches.md` 섹션 1/3에서 해당 key 관련 행 모두 삭제
- 상용구 삭제 → `template-list.json`에서 제거 + `cc-list.json`의 모든 `templateKeys`에서 해당 key 제거 + `ai-docs/templates/{templateKey}/` 폴더 삭제 + `ai-docs/pending-matches.md` 섹션 2/4에서 해당 key 관련 행 모두 삭제

---

### guide-list.json 동기화 규칙

- 가이드라인(guideKey)을 추가하거나 삭제할 때마다 `lib/ai/resources/guide-list.json`을 **항상 동기화**
- `cc-list.json`의 `guideKeys`에 키가 있으면 `guide-list.json`에도 반드시 항목 존재해야 함
- `guide-list.json`에 없는 가이드라인은 가이드라인 관리 페이지 드롭다운과 문진 패널 전체 목록에 **표시되지 않음**

### template-list.json 동기화 규칙

- 상용구(templateKey)를 추가하거나 삭제할 때마다 `lib/ai/resources/template-list.json`을 **항상 동기화**
- `cc-list.json`의 `templateKeys`에 키가 있으면 `template-list.json`에도 반드시 항목 존재해야 함

---

### pending-matches.md 확인 시점 요약

아래 작업 시 **반드시** `ai-docs/pending-matches.md`를 읽는다:

| 작업            | 확인할 섹션                                              |
| --------------- | -------------------------------------------------------- |
| C.C. 등록       | 섹션 3 (가이드라인→C.C. 대기), 섹션 4 (상용구→C.C. 대기) |
| 가이드라인 등록 | 섹션 1 (C.C.→가이드라인 대기)                            |
| 상용구 등록     | 섹션 2 (C.C.→상용구 대기)                                |

## 테스트 계정

Playwright MCP 또는 기타 검증 작업 시 아래 계정을 사용합니다:

- **이메일**: kh047@naver.com
- **비밀번호**: wjdrbgus123!

## 작업 완료 체크리스트

```bash
npm run check-all
npm run build
```
