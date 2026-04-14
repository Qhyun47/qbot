# AI 리소스 파일 준비 가이드

Task 003에서 생성하는 placeholder 파일들에 실제 내용을 채우기 위한 가이드입니다.
ChatGPT를 활용해 각 파일을 만들어오는 방법과 조건을 단계별로 설명합니다.

---

## AI 파이프라인 구조 이해

각 파일이 왜 필요한지 이해하려면 AI 3단계 파이프라인을 먼저 파악해야 합니다.

```
[의사 입력 카드들]
      ↓
  Stage 1: normalize   ← structured_schema.json 형식으로 출력
      ↓
  structured JSON
      ↓
  Stage 2: HPI 생성    ← style_guide.md 참조
      ↓
  HPI 줄글 (자유 텍스트)

  Stage 3: 상용구 채움  ← templates/*.json + examples/*.jsonl 참조
      ↓
  완성된 상용구
```

---

## Step 0: 지금 즉시 결정 — 출력 언어 확정

**차트 출력 언어를 먼저 확정하세요.** 이 결정이 모든 파일의 방향을 결정합니다.

| 선택지          | 설명                                              |
| --------------- | ------------------------------------------------- |
| **한국어 전체** | HPI와 상용구 모두 한국어. 가장 일반적             |
| **영어 전체**   | HPI와 상용구 모두 영어. 국제 논문 작성 등 목적 시 |
| **혼용**        | 의학 용어는 영어, 서술은 한국어                   |

> 아래 모든 예시는 **한국어 전체**를 기준으로 작성되었습니다.

---

## Step 1: C.C. 목록 설계 — `cc-list.json`

### 무엇인가

앱에서 자동완성에 사용하는 주호소(Chief Complaint) 목록. 이 목록에 있는 C.C.만 상용구 배지가 표시되고, 템플릿이 자동 로드됩니다.

### 왜 중요한가

- 이 목록이 확정되어야 어떤 템플릿 파일을 만들지 정해집니다
- 앱의 C.C. 자동완성 기능이 이 파일을 기반으로 동작합니다

### 파일 형식

```json
[
  {
    "cc": "흉통",
    "ccEnglish": "chest pain",
    "hasTemplate": true,
    "templateKey": "chest-pain"
  },
  {
    "cc": "호흡곤란",
    "ccEnglish": "dyspnea",
    "hasTemplate": true,
    "templateKey": "dyspnea"
  },
  {
    "cc": "두통",
    "ccEnglish": "headache",
    "hasTemplate": false,
    "templateKey": null
  }
]
```

### 조건

- `cc`는 의사가 실제로 타이핑하는 한국어 단어 (자동완성 기준)
- `templateKey`는 반드시 **영어 kebab-case** — 파일명으로 직접 사용됨 (`chest-pain.json`)
- `hasTemplate: true`인 항목마다 `templates/` 폴더에 대응하는 파일이 있어야 함

### ChatGPT 요청 예시

> "응급실에서 가장 자주 보는 C.C. 20~30개를 한국어와 영어(kebab-case) 쌍으로 정리해줘. 상용구가 있을 법한 것(흉통, 호흡곤란, 복통 등)과 없는 것을 구분해줘. 아래 JSON 형식으로."

**직접 확인할 사항**: 본인 병원에서 실제로 자주 쓰는 C.C. 표현을 기준으로 교정하세요. "흉통" vs "가슴통증" 중 어떤 표현을 더 많이 쓰는지가 중요합니다.

---

## Step 2: 정규화 스키마 설계 — `structured_schema.json` ⭐ 가장 중요

### 무엇인가

Stage 1(normalize)에서 Gemini AI가 의사의 키워드 카드들을 읽고 **반드시 이 형식으로 출력**해야 하는 JSON 구조입니다. 이 스키마가 Stage 2(HPI 생성)와 Stage 3(상용구 채움)의 입력이 됩니다.

### 왜 가장 중요한가

스키마를 잘못 설계하면:

- Stage 2에서 좋은 HPI를 만들 수 없음
- Stage 3에서 상용구 필드를 채울 수 없음
- 나중에 스키마를 바꾸면 프롬프트, 템플릿, 예시 파일을 모두 다시 만들어야 함

### 파일 형식 (JSON Schema draft-07)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StructuredCase",
  "description": "normalize 단계 출력 스키마. Task 010에서 Gemini Structured Output과 맞춰 확정.",
  "type": "object",
  "required": ["cc", "onset", "inputs"],
  "properties": {
    "cc": {
      "type": ["string", "null"],
      "description": "정규화된 주호소"
    },
    "onset": {
      "type": ["string", "null"],
      "description": "발생 시점 (예: '3일 전', '내원 2시간 전')"
    },
    "onset_minutes": {
      "type": ["integer", "null"],
      "description": "발생 시점을 분 단위로 변환한 값 (정렬용, 현재 기준 음수)"
    },
    "location": {
      "type": ["string", "null"],
      "description": "통증/증상 위치"
    },
    "character": {
      "type": ["string", "null"],
      "description": "통증/증상 양상"
    },
    "severity_nrs": {
      "type": ["integer", "null"],
      "minimum": 0,
      "maximum": 10,
      "description": "NRS 통증 점수"
    },
    "exacerbating_factors": {
      "type": "array",
      "items": { "type": "string" },
      "description": "악화 요인 목록"
    },
    "relieving_factors": {
      "type": "array",
      "items": { "type": "string" },
      "description": "완화 요인 목록"
    },
    "associated_symptoms": {
      "type": "array",
      "items": { "type": "string" },
      "description": "동반 증상 목록"
    },
    "medical_history": {
      "type": "array",
      "items": { "type": "string" },
      "description": "관련 과거력"
    },
    "medications": {
      "type": "array",
      "items": { "type": "string" },
      "description": "복용 약물"
    },
    "inputs": {
      "type": "array",
      "description": "원본 카드별 정규화 결과",
      "items": {
        "type": "object",
        "properties": {
          "raw_text": { "type": "string" },
          "normalized_text": { "type": "string" },
          "category": {
            "type": "string",
            "enum": [
              "onset",
              "location",
              "character",
              "severity",
              "associated",
              "history",
              "medication",
              "other"
            ]
          }
        }
      }
    }
  }
}
```

### ChatGPT 요청 예시

> "나는 응급실 의사고, 문진 키워드 카드들을 AI로 구조화된 JSON으로 변환하려 한다. 아래 예시 카드들을 보고, 어떤 필드들이 있어야 HPI와 상용구 생성에 충분할지 JSON Schema draft-07 형식으로 설계해줘.
>
> 예시 카드들:
>
> - '3일 전 시작'
> - '좌측 흉통'
> - '압박성'
> - 'NRS 7'
> - '운동 시 악화, 안정 시 호전'
> - '식은땀, 구역'
> - '고혈압 약 복용 중'
> - '이전 협심증 과거력'"

**직접 검토할 사항**: 생성된 스키마의 각 필드가 실제 문진에서 나오는 정보를 커버하는지 확인하세요. 필드가 너무 적으면 HPI가 빈약해지고, 너무 많으면 AI가 혼란스러워집니다.

---

## Step 3: HPI 스타일 가이드 — `style_guide.md`

### 무엇인가

Stage 2에서 AI가 HPI 문단을 생성할 때 참조하는 작성 가이드. AI가 "어떤 말투로, 얼마나 길게, 무엇을 반드시 넣어야 하는지"를 이 파일에서 배웁니다.

### 파일 형식 (Markdown)

```markdown
# HPI 차팅 스타일 가이드

## 언어 및 시제

- 언어: 한국어
- 시제: 과거형 ("내원함", "호소함", "확인됨")
- 어투: 의무기록 문체 (주어 생략 허용, 간결하게)

## 문장 길이 및 구조

- 전체 길이: 3~5문장
- 첫 문장: 발생 시점 + 주호소 + 내원 이유
- 이후: 통증 양상, 악화/완화 요인, 동반 증상 순서로 기술
- 마지막: 관련 과거력/복용 약물 (있는 경우만)

## 필수 포함 요소 (해당 정보가 있을 때)

- 발생 시점 (onset)
- 통증 위치 및 양상
- 중증도 (NRS)
- 동반 증상
- 악화/완화 요인

## 금지 사항

- "환자가 말하기를" 같은 인용 표현 금지
- 불확실한 추측 금지 ("아마도", "것 같음")
- 진단명 직접 언급 금지 (증상 기술만)
- 동일 표현 반복 금지

## 예시 출력

"3일 전 발생한 좌측 압박성 흉통으로 내원. NRS 7점 수준으로 운동 시 악화되며 안정 시 호전되는 양상. 식은땀 및 구역감을 동반함. 고혈압으로 약물 복용 중이며 과거 협심증 진단력 있음."
```

### ChatGPT 요청 예시

> "응급실 의무기록 HPI 작성 스타일 가이드를 Markdown으로 작성해줘. 한국어 의무기록 기준이고, 3~5문장의 간결한 문체여야 해. 시제, 어투, 필수 포함 요소, 금지 표현, 예시 출력을 포함해줘."

**직접 추가할 사항**: 본인이 실제로 쓰는 차팅 문체의 예시 문장 2~3개를 추가하면 AI가 훨씬 잘 따라옵니다.

---

## Step 4: 상용구 템플릿 — `templates/{cc}.json`

### 무엇인가

Stage 3에서 AI가 구조화된 JSON을 받아 **채워 넣어야 하는 상용구 틀**. 병원마다 다른 EMR 상용구 형식을 여기서 정의합니다.

### 핵심 결정: 상용구 형식 선택

**옵션 A — 필드 기반** (권장, AI가 가장 잘 처리)

```json
{
  "templateKey": "chest-pain",
  "label": "흉통",
  "fields": {
    "onset": "발생 시점:",
    "location": "위치:",
    "character": "양상:",
    "severity": "NRS:",
    "radiation": "방사통:",
    "exacerbating": "악화 요인:",
    "relieving": "완화 요인:",
    "associated": "동반 증상:",
    "pmhx": "관련 과거력:"
  }
}
```

AI가 각 필드의 값을 채워서 `위치: 좌측 흉부`, `NRS: 7점` 형식으로 출력합니다.

**옵션 B — 문장 블록** (현재 EMR 상용구가 문장형이면 선택)

```json
{
  "templateKey": "chest-pain",
  "label": "흉통",
  "template": "Chief Complaint: 흉통\nOnset: [발생 시점]\nLocation/Radiation: [위치/방사통]\nCharacter: [양상]\nSeverity: NRS [점수]점\nAssociated Sx: [동반 증상]\nAggravating: [악화 요인]\nRelieving: [완화 요인]\nPMHx: [관련 과거력]"
}
```

### ChatGPT 요청 예시

> "응급실 흉통 환자 차팅에 쓰는 상용구 템플릿을 만들어줘. 필드 기반 JSON 형식으로, 각 필드는 의사가 채워야 할 항목들이야. 필드명은 영어, 설명은 한국어로. onset, location, character, severity, radiation, exacerbating, relieving, associated symptoms, past medical history를 포함해줘."

**직접 제공할 사항**: 현재 EMR에서 실제로 쓰고 있는 상용구 1개를 복사해서 ChatGPT에게 주고 "이 형식으로 JSON 템플릿을 만들어줘"라고 하면 가장 정확합니다.

---

## Step 5: 문진 가이드라인 — `guides/{cc}.md`

### 무엇인가

새 케이스 입력 화면에서 의사 옆에 표시되는 **문진 체크리스트**. AI가 사용하는 것이 아니라 의사가 문진할 때 참고하는 자료입니다.

### 파일 형식 (Markdown)

```markdown
# 흉통 (Chest Pain) 문진 가이드라인

## 핵심 문진 항목

- [ ] 발생 시점 및 경과 (급성/서서히)
- [ ] 통증 위치 및 방사통 (턱, 좌측 팔, 등)
- [ ] 통증 양상 (압박성/찌르는/타는)
- [ ] NRS 점수
- [ ] 악화 요인 (운동, 호흡, 체위)
- [ ] 완화 요인 (안정, 질산염, 자세)
- [ ] 동반 증상 (호흡곤란, 식은땀, 구역, 실신)

## 주요 감별 진단 포인트

- ACS: 압박성, 방사통, 식은땀, 위험인자 (당뇨/고혈압/흡연)
- PE: 갑작스러운 발생, 호흡곤란 동반, 최근 부동/수술력
- 대동맥박리: 찢어지는 양상, 등으로 방사, 혈압 차이
- 기흉: 갑작스러운 발생, 한쪽 호흡음 감소

## 주의할 위험 신호

- 안정 시 발생하는 압박성 흉통
- 실신 동반
- 혈압 불안정
```

### ChatGPT 요청 예시

> "응급실 흉통 환자 문진 가이드라인을 Markdown 체크리스트 형식으로 만들어줘. 핵심 문진 항목, 주요 감별 진단 포인트(ACS, PE, 대동맥박리, 기흉), 위험 신호 3개 섹션으로 구성해줘. 간결하고 실용적으로."

**만들어야 할 파일 수**: `hasTemplate: true`인 C.C.와 빈도 높은 C.C. 우선으로 5~10개면 충분합니다.

---

## Step 6: 실제 케이스 샘플 — `fixtures/` (Task 010 착수 직전 제공)

### 무엇인가

AI 품질 검증을 위한 테스트 케이스. 실제 문진한 환자 사례를 익명화한 JSON 파일입니다.

### 파일 형식

```json
{
  "case": {
    "cc": "흉통",
    "bedZone": "A",
    "bedNumber": 3
  },
  "inputs": [
    {
      "rawText": "3일 전 시작",
      "timeTag": "3일 전",
      "timeOffsetMinutes": -4320
    },
    { "rawText": "좌측 압박성 흉통" },
    { "rawText": "NRS 7" },
    { "rawText": "운동 시 악화" },
    { "rawText": "안정 시 호전" },
    { "rawText": "식은땀, 구역" },
    { "rawText": "고혈압 약 복용 중" }
  ],
  "expectedHpi": "3일 전 발생한 좌측 압박성 흉통으로 내원. NRS 7점으로 운동 시 악화되며 안정 시 호전되는 양상. 식은땀 및 구역감 동반. 고혈압으로 약물 복용 중.",
  "expectedTemplate": {
    "onset": "3일 전",
    "location": "좌측 흉부",
    "character": "압박성",
    "severity": "7점",
    "exacerbating": "운동",
    "relieving": "안정",
    "associated": "식은땀, 구역",
    "pmhx": "고혈압"
  }
}
```

### 조건

- **반드시 익명화**: 날짜, 이름, 나이, 병록번호 등 개인식별 정보 제거
- 2~3개로 충분 (C.C. 다양하게: 흉통 1개, 호흡곤란 1개, 복통 1개 등)
- `expectedHpi`와 `expectedTemplate`는 의사가 직접 작성한 "이상적인 출력 예시"

---

## 준비 우선순위 요약

| 순서 | 파일                     | 시점                   | 난이도 | 비고                      |
| ---- | ------------------------ | ---------------------- | ------ | ------------------------- |
| 1    | 언어 결정                | **지금**               | —      | 모든 것의 기준            |
| 2    | `cc-list.json`           | **지금~1주**           | 쉬움   | 병원 C.C. 목록 기준       |
| 3    | `structured_schema.json` | **Phase 1~2 중**       | 어려움 | 가장 중요, ChatGPT 활용   |
| 4    | `style_guide.md`         | Phase 1~2 중           | 쉬움   | 실제 차팅 예시 1~2개 포함 |
| 5    | `templates/*.json`       | Phase 1~2 중           | 보통   | 형식 결정 후 EMR 참고     |
| 6    | `guides/*.md`            | Phase 2 중             | 쉬움   | 5~10개                    |
| 7    | `fixtures/`              | **Task 010 착수 직전** | 보통   | 익명화 케이스 2~3개       |
| 8    | Gemini API 키            | Task 010 착수 직전     | —      | Google AI Studio에서 발급 |

**ChatGPT 요청 권장 순서**: `cc-list.json` → `structured_schema.json` → `style_guide.md` → `templates/` 순서로 진행하세요. 앞 파일이 뒤 파일의 기준이 됩니다.
