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

### 핵심 파일 위치

| 파일                                  | 역할                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `lib/ai/resources/cc-list.json`       | 정형 C.C. 목록 (단일 소스, `{ cc, guideKeys[], templateKeys[], aliasOf? }`) |
| `lib/ai/resources/template-list.json` | 상용구 표시명 목록 (`{ templateKey, displayName }`)                         |
| `ai-docs/cc/{key}/guide.md`           | 시스템 가이드라인 파일                                                      |
| `ai-docs/cc/{key}/template.json`      | 상용구 템플릿 파일 (`fields`, `pe`, `history` 섹션 포함)                    |
| `ai-docs/cc/{key}/schema.json`        | AI 정규화 스키마 파일                                                       |
| `ai-docs/pending-matches.md`          | 미매칭 C.C. 추적 파일                                                       |
| `fixtures/{cc-key}-{n}.json`          | AI 품질 검증용 케이스 예시 데이터                                           |

---

### 정형 C.C. 추가 절차

1. `lib/ai/resources/cc-list.json`에 항목 추가:
   ```json
   { "cc": "Dizziness", "guideKeys": [], "templateKeys": [] }
   ```

   - C.C. 표기는 Sentence case (의학 약어 제외), key는 kebab-case
2. 가이드라인/상용구 키를 사용자가 함께 알려준 경우:
   - **1개**: 즉시 해당 키를 guideKeys/templateKeys에 추가
   - **2개 이상**: 추천 목록으로 제시만 하고 자동 연결하지 않음. 사용자가 선택하면 그때 추가
3. 가이드라인/상용구 없이 C.C.만 등록하는 경우:
   - `ai-docs/pending-matches.md`를 읽어 동일/유사 항목이 이미 있는지 확인
   - 없으면 아래 양식으로 새 항목 추가:
     ```
     ### {C.C. 이름}
     - 등록일: YYYY-MM-DD
     - 가이드라인: 없음
     - 상용구: 없음
     - 메모: -
     ```
4. 상용구(templateKeys)가 추가된 경우 → 케이스 예시 데이터 절차 참조

---

### 가이드라인 추가 절차

1. `ai-docs/cc/{guideKey}/guide.md` 파일 생성 (Markdown, 문진 체크리스트 + 감별진단 + 위험신호 포함)
2. **`ai-docs/pending-matches.md`를 읽는다** → 새 가이드라인 이름과 동일/유사한 미매칭 C.C.가 있는지 확인
   - 있으면: "이 가이드라인을 {C.C.}와 매칭할까요?" 사용자에게 질문
   - 없으면: 이름 기반으로 적절한 C.C.를 추천하며 매칭 여부 질문
3. 매칭할 C.C.가 결정되면:
   - `lib/ai/resources/cc-list.json`에서 해당 C.C. 항목의 `guideKeys`에 키 추가
   - `cc-list.json`에 해당 C.C.가 없으면: 즉시 정형 C.C. 추가 여부를 사용자에게 질문
4. 매칭 완료 시 `ai-docs/pending-matches.md` 업데이트:
   - 미매칭 항목에서 제거 → 매칭 완료 기록 테이블에 추가
5. **가이드라인 추가 시 케이스 예시 데이터는 불필요** (AI 파이프라인에 직접 영향 없음)

---

### 상용구 추가 절차

1. 아래 파일들을 생성:
   - `ai-docs/cc/{templateKey}/template.json` — 상용구 템플릿 (기존 chest-pain.json 구조 참조)
     - **`pe` 섹션 필수**: `fields[]` + `output_example` 구조. 사용자에게 P/E 양식을 요청해 입력받아야 함
     - **`history` 섹션 필수**: `fields[]` + `output_example` 구조. 사용자에게 History 양식을 요청해 입력받아야 함
   - `ai-docs/cc/{templateKey}/schema.json` — AI 정규화 스키마 (기존 chest-pain.json 구조 참조)
2. `lib/ai/resources/template-list.json`에 항목 추가:
   ```json
   { "templateKey": "new-key", "displayName": "Display Name" }
   ```
3. **`ai-docs/pending-matches.md`를 읽는다** → 가이드라인 추가 절차의 2~4단계와 동일하게 C.C. 매칭 처리. 단, `templateKeys`에 추가
4. **P/E 및 History 양식 수집**: 상용구 파일 생성 전 반드시 사용자에게 순서대로 요청:
   - "이 상용구의 P/E 양식(기본값 상태의 출력 포맷)을 알려주세요."
   - "이 상용구의 History 양식(기본값 상태의 출력 포맷)을 알려주세요."
5. **케이스 예시 데이터 요청**: 상용구 추가가 완료되면 반드시 사용자에게 다음을 요청:
   > "AI 차팅 품질 향상을 위해 {C.C.} 케이스 예시 데이터가 필요합니다. `fixtures/{cc-key}-{n}.json` 형식으로 실제 문진 카드 입력 예시를 제공해 주실 수 있나요?"

---

### 케이스 예시 데이터 추가 절차

- **저장 위치**: `fixtures/{cc-key}-{n}.json` (예: `fixtures/dizziness-01.json`)
- **형식**: 기존 `fixtures/case-01.json` 구조 참조 (`case`, `inputs`, `expectedHpi?`, `expectedTemplate?`)
- **검증**: 데이터 제공 즉시 하네스로 실행:
  ```bash
  npx tsx --env-file=.env.local scripts/ai-harness.ts fixtures/{파일명}.json
  ```
- **추가 기준**:
  - 상용구(templateKeys)가 있는 C.C.: **필수** (최소 1개)
  - 가이드라인만 있고 상용구 없는 C.C.: 불필요

---

### template-list.json 동기화 규칙

- 상용구(templateKey)를 추가하거나 삭제할 때마다 `lib/ai/resources/template-list.json`을 **항상 동기화**
- `cc-list.json`의 `templateKeys`에 키가 있으면 `template-list.json`에도 반드시 항목 존재해야 함

---

### pending-matches.md 확인 규칙 요약

아래 작업을 수행할 때 **반드시** `ai-docs/pending-matches.md`를 먼저 읽는다:

- 가이드라인을 추가할 때
- 상용구를 추가할 때

읽은 후 판단:

1. 새로 추가하는 리소스 이름과 같거나 유사한 미매칭 C.C.가 있으면 → 사용자에게 매칭 여부 질문
2. 매칭이 확정되면 → cc-list.json 업데이트 + pending-matches.md 업데이트

## 테스트 계정

Playwright MCP 또는 기타 검증 작업 시 아래 계정을 사용합니다:

- **이메일**: kh047@naver.com
- **비밀번호**: wjdrbgus123!

## 작업 완료 체크리스트

```bash
npm run check-all
npm run build
```
