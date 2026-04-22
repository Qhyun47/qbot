가이드라인 추가 워크플로우를 실행합니다.

추가 대상 키: $ARGUMENTS

시작 전 반드시 아래 순서로 파일을 읽습니다:

1. `lib/ai/resources/guide-list.json` — 중복 및 기존 항목 확인
2. `lib/ai/resources/cc-list.json` — 사용자가 언급한 C.C. 존재 여부 확인용
3. `ai-docs/pending-matches.md` — 대기 커넥션 확인 (섹션 1: C.C.→가이드라인 대기)

이후 CLAUDE.md "가이드라인 추가 절차"를 단계별로 따릅니다.

**커넥션 처리 흐름:**

- 사용자가 C.C. 커넥션을 언급한 경우:
  - cc-list.json에 해당 C.C. 존재 → 해당 C.C.의 guideKeys에 즉시 추가
  - 존재하지 않음 → pending-matches.md 섹션 3(가이드라인→C.C. 대기)에 기록 (중복 확인 후)
  - 커넥션 언급이 없으면 아무것도 기록하지 않음

**대기 커넥션 확인:**

- pending-matches.md 섹션 1에서 이 guideKey를 기다리는 C.C.가 있으면 → 연결 여부 질문
- 수락: cc-list.json 업데이트 + 해당 행 삭제 / 거절: 해당 행 삭제만

**반드시 수행해야 하는 필수 파일 업데이트:**

- `ai-docs/cc/{guideKey}/guide.md` 생성
- `lib/ai/resources/guide-list.json`에 항목 추가 (누락 시 가이드라인 관리 페이지와 문진 패널에 표시되지 않음)
- C.C. 커넥션이 확정된 경우에만 → `lib/ai/resources/cc-list.json`의 해당 C.C. `guideKeys`에 키 추가
- `ai-docs/pending-matches.md` 업데이트 (해당 시)
