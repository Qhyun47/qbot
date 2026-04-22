상용구 추가 워크플로우를 실행합니다.

추가 대상 키: $ARGUMENTS

시작 전 반드시 아래 순서로 파일을 읽습니다:

1. `ai-docs/pending-matches.md` — 미매칭 C.C. 확인 (매칭 후보 파악)
2. `lib/ai/resources/cc-list.json` — 기존 C.C. 목록 확인
3. `lib/ai/resources/template-list.json` — 기존 상용구 목록 및 중복 확인
4. `ai-docs/cc/chest-pain/template.json` — 템플릿 구조 참조 (pe, history 섹션 구조 포함)
5. `ai-docs/cc/chest-pain/schema.json` — 스키마 구조 참조

이후 CLAUDE.md "상용구 추가 절차"를 단계별로 따릅니다.

**반드시 사용자에게 순서대로 요청해야 하는 양식:**

1. 상용구 양식 (template fields + output_example)
2. P/E 양식 (기본값 상태의 출력 포맷) → pe 섹션에 저장
3. History 양식 (기본값 상태의 출력 포맷) → history 섹션에 저장
4. 케이스 예시 데이터 (fixtures/{cc-key}-{n}.json)
