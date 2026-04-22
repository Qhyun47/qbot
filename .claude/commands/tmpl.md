상용구 추가 워크플로우를 실행합니다.

추가 대상 키: $ARGUMENTS

시작 전 반드시 아래 순서로 파일을 읽습니다:

1. `lib/ai/resources/template-list.json` — 중복 및 기존 항목 확인
2. `lib/ai/resources/cc-list.json` — 사용자가 언급한 C.C. 존재 여부 확인용
3. `ai-docs/pending-matches.md` — 대기 커넥션 확인 (섹션 2: C.C.→상용구 대기)
4. `ai-docs/cc/chest-pain/template.json` — 템플릿 구조 참조 (fields, pe, history 섹션 구조 포함)
5. `ai-docs/cc/chest-pain/schema.json` — 스키마 구조 참조

이후 CLAUDE.md "상용구 추가 절차"를 단계별로 따릅니다.

**커넥션 처리 흐름:**

- 사용자가 C.C. 커넥션을 언급한 경우:
  - cc-list.json에 해당 C.C. 존재 → 해당 C.C.의 templateKeys에 즉시 추가
  - 존재하지 않음 → pending-matches.md 섹션 4(상용구→C.C. 대기)에 기록 (중복 확인 후)
  - 커넥션 언급이 없으면 아무것도 기록하지 않음

**대기 커넥션 확인:**

- pending-matches.md 섹션 2에서 이 templateKey를 기다리는 C.C.가 있으면 → 연결 여부 질문
- 수락: cc-list.json 업데이트 + 해당 행 삭제 / 거절: 해당 행 삭제만

**반드시 사용자에게 순서대로 요청해야 하는 양식:**

1. P.I. template 양식 (현병력 구조화 필드 + output_example) → fields 섹션에 저장
2. History 양식 (기본값 상태의 출력 포맷) → history 섹션에 저장
3. P/E 양식 (기본값 상태의 출력 포맷) → pe 섹션에 저장
4. 케이스 예시 데이터 (fixtures/{cc-key}-{n}.json)
