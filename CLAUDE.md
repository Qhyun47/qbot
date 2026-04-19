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

## 테스트 계정

Playwright MCP 또는 기타 검증 작업 시 아래 계정을 사용합니다:

- **이메일**: kh047@naver.com
- **비밀번호**: wjdrbgus123!

## 작업 완료 체크리스트

```bash
npm run check-all
npm run build
```
