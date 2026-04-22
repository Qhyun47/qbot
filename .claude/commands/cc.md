정형 C.C. 추가 워크플로우를 실행합니다.

추가 대상: $ARGUMENTS

시작 전 반드시 아래 순서로 파일을 읽습니다:

1. `lib/ai/resources/cc-list.json` — 중복 및 기존 항목 확인
2. `lib/ai/resources/guide-list.json` — 사용자가 언급한 guideKey 존재 여부 확인용
3. `lib/ai/resources/template-list.json` — 사용자가 언급한 templateKey 존재 여부 확인용
4. `ai-docs/pending-matches.md` — 역방향 대기 커넥션 확인 (섹션 3: 가이드라인→C.C. 대기, 섹션 4: 상용구→C.C. 대기)

이후 CLAUDE.md "정형 C.C. 추가 절차"를 단계별로 따릅니다.

**커넥션 처리 흐름:**

- 사용자가 guideKey를 언급한 경우:
  - guide-list.json에 존재 → guideKeys에 즉시 추가
  - 존재하지 않음 → pending-matches.md 섹션 1(C.C.→가이드라인 대기)에 기록 (중복 확인 후)
- 사용자가 templateKey를 언급한 경우:
  - template-list.json에 존재 → templateKeys에 즉시 추가
  - 존재하지 않음 → pending-matches.md 섹션 2(C.C.→상용구 대기)에 기록 (중복 확인 후)
- 커넥션 언급이 없으면 pending 기록 없음

**역방향 pending 확인:**

- pending-matches.md 섹션 3에서 이 C.C.를 기다리는 가이드라인이 있으면 → 연결 여부 질문
- pending-matches.md 섹션 4에서 이 C.C.를 기다리는 상용구가 있으면 → 연결 여부 질문
- 수락: cc-list.json 업데이트 + 해당 행 삭제 / 거절: 해당 행 삭제만
