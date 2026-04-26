# 규봇

응급실 의사가 모바일로 문진 정보를 입력하면 AI가 차팅 초안을 자동 생성해주는 어시스턴트입니다.

## 기술 스택

| 영역       | 라이브러리                                          |
| ---------- | --------------------------------------------------- |
| 프레임워크 | Next.js 15 App Router, React 19, TypeScript 5       |
| 스타일링   | Tailwind CSS v3, shadcn/ui (new-york), Lucide Icons |
| 백엔드/DB  | Supabase (Auth + PostgreSQL + RLS)                  |
| AI         | Google Gemini Flash (`@google/genai`)               |
| 폼         | react-hook-form 7, Zod 4                            |
| PWA        | manifest.json + Service Worker                      |
| 기타       | dnd-kit, date-fns, Sonner, next-themes              |
| 배포       | Vercel Hobby (Free)                                 |

## 핵심 기능

- **AI 차팅 자동 생성**: C.C. + 문진 카드 입력 → P.I. / 상용구 / P/E / History 초안 자동 생성
- **문진 가이드라인**: C.C.별 의학 가이드라인 분할 화면 실시간 참조
- **베드번호 관리**: 응급실 구역(A/B/R)별 베드번호 선택
- **케이스 관리**: 케이스 생성·조회·결과 편집·복사
- **PWA 지원**: 홈 화면 설치, 오프라인 페이지, 전체화면 모드
- **권한 관리**: AI 생성 권한 신청 및 관리자 승인 시스템
- **관리자 대시보드**: 에러 로그 조회, 사용자 접근 권한 관리, 리소스 확인

## 프로젝트 구조

```
├── app/                  # Next.js App Router 라우트
│   ├── (app)/            # 인증 후 접근 영역
│   │   ├── dashboard/    # 메인 대시보드
│   │   ├── cases/        # 케이스 목록·생성·상세
│   │   ├── guidelines/   # 가이드라인 관리
│   │   ├── settings/     # 설정
│   │   └── admin/        # 관리자 전용
│   ├── auth/             # 인증 페이지 (로그인·회원가입 등)
│   └── api/              # API 라우트 (AI 생성·상태 폴링·PDF 파싱)
├── components/           # UI 컴포넌트
│   ├── ui/               # shadcn/ui 기반 기본 요소
│   ├── cases/            # 케이스 관련 컴포넌트
│   ├── admin/            # 관리자 컴포넌트
│   ├── ai-access/        # AI 권한 요청 컴포넌트
│   └── pwa/              # PWA 설치·전체화면 관리
├── lib/                  # 비즈니스 로직
│   ├── ai/               # AI 파이프라인 (5단계)
│   ├── cases/            # 케이스 CRUD + 베드 설정
│   ├── auth/             # 권한 확인
│   └── supabase/         # Supabase 클라이언트
├── ai-docs/              # AI 의료 리소스
│   ├── guides/           # 의학 가이드라인 (25개)
│   ├── templates/        # 상용구 템플릿 (28개)
│   └── prompts/          # AI 프롬프트 (5단계)
└── docs/                 # 개발 문서
    ├── PRD.md
    ├── ROADMAP.md
    └── guide/            # 개발 가이드
```

## AI 파이프라인

문진 카드 입력 → 5단계 처리:

1. **Stage 1** (순차): 입력 정규화 (Gemini Structured Output)
2. **Stage 2~5** (병렬, `Promise.all`):
   - Stage 2: P.I. (현병력) 줄글 생성
   - Stage 3: 상용구 채우기 (P.I. template)
   - Stage 4: P/E (신체검사) 생성
   - Stage 5: History (과거력) 생성

병렬 처리로 총 소요 시간 6~10초 (Vercel Hobby 10초 한도 내).

## 의료 리소스 구조

AI 차팅에 사용되는 의료 리소스는 `ai-docs/`에 저장됩니다.

- **가이드라인** (`ai-docs/guides/`, 25개): C.C.별 의학 가이드라인 HTML
- **상용구** (`ai-docs/templates/`, 28개): 각 C.C.의 P.I. template · History · P/E 섹션 + 케이스 예시
- **프롬프트** (`ai-docs/prompts/`, 5개): 5단계 AI 생성 프롬프트

C.C. 목록 및 가이드라인·상용구 간 연결 관계는 `lib/ai/resources/`에서 관리합니다.
