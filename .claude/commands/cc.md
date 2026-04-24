정형 C.C. 추가 워크플로우를 실행합니다.

추가 대상: $ARGUMENTS

시작 전 반드시 아래 순서로 파일을 읽습니다:

1. `lib/ai/resources/cc-list.json` — 중복 및 기존 항목 확인
2. `lib/ai/resources/guide-list.json` — guideKey 존재 여부 확인용
3. `lib/ai/resources/template-list.json` — templateKey 존재 여부 확인용
4. `ai-docs/pending-matches.md` — 역방향 대기 커넥션 확인 (섹션 3: 가이드라인→C.C. 대기, 섹션 4: 상용구→C.C. 대기)

파일 읽기가 끝나면, C.C.가 이미 cc-list.json에 존재하는 경우 중복임을 알리고 중단합니다.

---

**별칭(Alias) 여부 확인:**

항목 추가 전, 반드시 사용자에게 명시적으로 질문합니다:
"이 C.C.는 다른 C.C.의 별칭인가요? (예: Hematemesis는 'GI bleeding'의 별칭) 별칭이면 원본 C.C. 이름을 알려주세요. 독립 C.C.라면 '없음'이라고 답해주세요."

- **별칭인 경우**: `{ "cc": "...", "guideKeys": [], "templateKeys": [], "aliasOf": "원본 C.C." }` 형태로 추가합니다.
  - 별칭 C.C.는 직접 커넥션을 가질 수 없습니다. 가이드라인/상용구는 원본 C.C.의 것을 런타임에서 자동으로 사용합니다.
  - 아래 가이드라인/상용구 커넥션 확인 단계를 **건너뜁니다**.
- **독립 C.C.인 경우**: `{ "cc": "...", "guideKeys": [], "templateKeys": [] }` 형태로 추가하고 아래 커넥션 확인을 계속합니다.

---

**가이드라인 커넥션 확인:** (독립 C.C.일 때만 수행)

항목 추가 후, 반드시 사용자에게 명시적으로 질문합니다:
"이 C.C.와 연결할 가이드라인이 있나요? (displayName 또는 guideKey로 알려주세요. 없으면 '없음'이라고 답해주세요.)"

커넥션 처리:

- 사용자가 가이드라인을 답한 경우:
  - guide-list.json에 해당 key **존재** → `guideKeys`에 즉시 추가
  - **존재하지 않음** → `ai-docs/pending-matches.md` 섹션 1(C.C.→가이드라인 대기)에 기록 (중복 확인 후)
- 사용자가 '없음'이라고 답한 경우: 아무것도 기록하지 않음

---

**상용구 커넥션 확인:** (독립 C.C.일 때만 수행)

가이드라인 처리 후, 반드시 사용자에게 명시적으로 질문합니다:
"이 C.C.와 연결할 상용구가 있나요? (displayName 또는 templateKey로 알려주세요. 없으면 '없음'이라고 답해주세요.)"

커넥션 처리:

- 사용자가 상용구를 답한 경우:
  - template-list.json에 해당 key **존재** → `templateKeys`에 즉시 추가
  - **존재하지 않음** → `ai-docs/pending-matches.md` 섹션 2(C.C.→상용구 대기)에 기록 (중복 확인 후)
- 사용자가 '없음'이라고 답한 경우: 아무것도 기록하지 않음

---

**역방향 pending 확인:** (독립 C.C.일 때만 수행)

- pending-matches.md 섹션 3에서 이 C.C.를 기다리는 가이드라인이 있으면 → 연결 여부 질문
- pending-matches.md 섹션 4에서 이 C.C.를 기다리는 상용구가 있으면 → 연결 여부 질문
- 수락: cc-list.json 업데이트 + 해당 행 삭제 / 거절: 해당 행 삭제만
