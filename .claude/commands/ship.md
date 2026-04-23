현재 변경사항을 분석하여 한국어 커밋 메시지를 작성하고, git commit 후 origin/master로 push합니다.

## 실행 순서

1. `git status`로 변경 파일 목록 확인
2. `git diff`로 실제 변경 내용 확인
3. `git log --oneline -5`로 최근 커밋 메시지 스타일 파악
4. 변경 내용을 분석해 한국어 커밋 메시지 작성
5. 사용자 확인 없이 즉시 commit + push 진행

## 커밋 메시지 규칙

- 제목: 변경의 핵심을 한 줄로 요약 (50자 이내)
- 본문: 변경 항목을 `-` 불릿으로 나열 (필요한 경우만)
- 마지막 줄: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

## 스테이징 규칙

- 임시 파일, 로그 파일, `.env` 계열은 절대 포함하지 않음
- `shrimp_data/` 폴더는 포함하지 않음
- 변경된 소스 파일만 명시적으로 `git add` (와일드카드 지양)

$ARGUMENTS
