정형 C.C. 추가 워크플로우를 실행합니다.

추가 대상: $ARGUMENTS

시작 전 반드시 아래 순서로 파일을 읽습니다:

1. `lib/ai/resources/cc-list.json` — 중복 및 기존 항목 확인
2. `lib/ai/resources/guide-list.json` — guideKey 존재 여부 확인용
3. `lib/ai/resources/template-list.json` — templateKey 존재 여부 확인용
4. `ai-docs/pending-matches.md` — 역방향 대기 커넥션 확인 (섹션 3: 가이드라인→C.C. 대기, 섹션 4: 상용구→C.C. 대기)

파일 읽기가 끝나면, C.C.가 이미 cc-list.json에 존재하는 경우 중복임을 알리고 중단합니다.

---

**패턴 C.C. 여부 확인:**

인수($ARGUMENTS)에 `**`가 포함된 경우, 이 C.C.는 **패턴 C.C.**입니다. 아래 패턴 C.C. 절차를 따르고 일반 절차(별칭 확인 등)를 건너뜁니다.

패턴 형식:

- `"vaginal **"` — "vaginal"로 시작하는 모든 C.C. (prefix 패턴)
- `"** pain"` — "pain"으로 끝나는 모든 C.C. (suffix 패턴)

**패턴 C.C. 처리 절차:**

1. cc-list.json에 패턴 항목 추가: `{ "cc": "vaginal **", "guideKeys": [], "templateKeys": [] }`
   - Sentence case 규칙은 적용하지 않습니다 (`**` 포함 항목은 그대로 저장).

2. 반드시 사용자에게 예시 C.C. 목록을 요청합니다:

   > "이 패턴 C.C.의 대표 예시를 알려주세요. (예: 'Vaginal bleeding, Vaginal discharge') 예시가 있어야 자동완성이 작동합니다. 나중에 추가도 가능하지만, 지금 최대한 입력해주세요."
   - 사용자가 예시를 제공하지 않거나 '없음'이라고 답하면, 반드시 다시 한 번 명시적으로 요청합니다:
     > "예시가 하나도 없으면 자동완성이 동작하지 않습니다. 지금 입력할 수 있는 예시가 없으신가요? 정말 없으면 '없음'으로 진행하겠습니다."
   - 두 번째 요청에도 '없음'이라고 하면 예시 없이 진행합니다.

3. 예시를 제공한 경우, 각 예시를 패턴 항목 바로 뒤에 추가합니다:
   `{ "cc": "Vaginal bleeding", "guideKeys": [], "templateKeys": [], "patternOf": "vaginal **" }`
   - 예시 항목에는 `patternOf` 필드로 부모 패턴을 참조합니다.
   - 예시 항목 자체의 `guideKeys`, `templateKeys`는 항상 빈 배열로 저장합니다 (런타임에서 부모 패턴의 값을 자동으로 가져옵니다).
   - 예시 항목도 Sentence case를 적용합니다.

4. 가이드라인 커넥션 확인 (패턴 항목에 설정):
   - "이 패턴 C.C.와 연결할 가이드라인이 있나요? (없으면 '없음')"
   - 있으면 → guide-list.json 존재 여부 확인 후 패턴 항목의 `guideKeys`에 추가 또는 pending 기록

5. 상용구 커넥션 확인 (패턴 항목에 설정):
   - "이 패턴 C.C.와 연결할 상용구가 있나요? (없으면 '없음')"
   - 있으면 → template-list.json 존재 여부 확인 후 패턴 항목의 `templateKeys`에 추가 또는 pending 기록

6. 역방향 pending 확인은 패턴 C.C.에는 수행하지 않습니다.

---

**별칭(Alias) 여부 확인:** (패턴 C.C.가 아닌 경우에만 수행)

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
