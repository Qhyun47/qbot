# 규봇

응급실 의사가 모바일로 문진 키워드를 입력하면 AI가 차팅 초안(P.I. / 상용구 / P/E / History)을 자동 생성해주는 어시스턴트입니다.

## 기술 스택

- **프레임워크**: Next.js 15 App Router, React 19, TypeScript
- **스타일링**: Tailwind CSS v3, shadcn/ui
- **백엔드/DB**: Supabase (Auth + PostgreSQL + RLS)
- **AI**: Google Gemini Flash (`@google/genai`)
- **PWA**: manifest.json + Service Worker
- **배포**: Vercel Hobby(Free)

## 로컬 개발

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

### 2. 패키지 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

### 기타 명령어

```bash
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

## Vercel 배포

### 필요 환경 변수

Vercel 프로젝트 설정 → Environment Variables에 아래 3개를 등록합니다:

| 변수명                                 | 설명                     |
| -------------------------------------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon(public) 키 |
| `GOOGLE_GENAI_API_KEY`                 | Google Gemini API 키     |

### 배포 방법

GitHub 저장소를 Vercel에 연결하거나 Vercel CLI로 배포합니다:

```bash
npx vercel --prod
```

> **참고**: `ai-docs/` 폴더는 AI 파이프라인에서 `fs.readFileSync`로 직접 읽으므로, 반드시 Git에 포함되어야 합니다.

## AI 파이프라인

문진 카드 입력 → 5단계 처리:

1. **Stage 1** (순차): 입력 정규화 (Gemini Structured Output)
2. **Stage 2~5** (병렬, `Promise.all`): P.I. 생성 · 상용구 생성 · P/E 생성 · History 생성

병렬 처리로 총 소요시간 6~10초 (Vercel Hobby 10초 한도 내).
