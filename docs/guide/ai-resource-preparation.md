# AI 리소스 파일 준비 가이드

Task 003에서 생성하는 placeholder 파일들에 실제 내용을 채우기 위한 가이드입니다.
ChatGPT를 활용해 각 파일을 만들어오는 방법과 조건을 단계별로 설명합니다.

---

## AI 파이프라인 구조 이해

각 파일이 왜 필요한지 이해하려면 AI 4단계 파이프라인을 먼저 파악해야 합니다.

```
[의사 입력 카드들]
      ↓
  Stage 1: normalize   ← schemas/{cc}.json 형식으로 출력
      ↓                  (각 카드에 섹션 분류 포함: hpi / template / history)
  structured JSON
      ↓
  Stage 2: HPI 생성    ← style_guide.md 참조, hpi 태그 필드만 사용
      ↓
  HPI 줄글 (자유 텍스트)

  Stage 3: 상용구 채움  ← templates/{cc}.json 참조, template 태그 필드만 사용
      ↓
  완성된 상용구

  Stage 4: History 생성  ← history 태그 필드만 사용
      ↓
  Past Hx. / Med Hx. / Op Hx. (항상 포함, 내용 없으면 (-))
  Family Hx. (내용 있을 때만 포함)
```

> **섹션 분류 원칙**: 하나의 카드가 두 개 이상의 섹션에 동시에 속할 수 있습니다. 예를 들어 "고혈압 약 복용 중"은 HPI 줄글에도 언급되고, 상용구의 PMHx 필드에도 들어가며, History의 Med Hx.에도 포함될 수 있습니다. 어떤 카드가 어느 섹션에 해당하는지는 실제 차팅 데이터를 기반으로 ChatGPT가 판단합니다.

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

## Step 2: C.C.별 정규화 스키마 설계 — `schemas/{cc}.json` ⭐ 가장 중요

### 무엇인가

Stage 1(normalize)에서 Gemini AI가 의사의 키워드 카드들을 읽고 **반드시 이 형식으로 출력**해야 하는 JSON 구조입니다. 이 스키마가 Stage 2(HPI 생성)와 Stage 3(상용구 채움)의 입력이 됩니다.

**C.C.마다 별도 파일로 관리합니다.** 저장 경로: `lib/ai/resources/schemas/{templateKey}.json`

```
lib/ai/resources/schemas/
├── chest-pain.json
├── dyspnea.json
├── hemoptysis.json
├── abdominal-pain.json
└── gi-bleeding.json
```

### 왜 C.C.별로 분리하는가

C.C.마다 필요한 문진 항목이 다릅니다. 하나의 스키마로 모든 케이스를 처리하면 AI가 해당 C.C.와 무관한 필드에 값을 억지로 채우거나, 반드시 있어야 할 필드가 빠질 수 있습니다. C.C.별로 스키마를 분리하면 AI가 꼭 필요한 정보만 정확하게 추출합니다.

### 왜 가장 중요한가

스키마를 잘못 설계하면:

- Stage 2에서 좋은 HPI를 만들 수 없음
- Stage 3에서 상용구 필드를 채울 수 없음
- 나중에 스키마를 바꾸면 프롬프트, 템플릿, 예시 파일을 모두 다시 만들어야 함

### 배경: 제공하는 차팅 데이터가 무엇인지

여기서 말하는 "차팅 데이터"는 **의사가 컴퓨터 앞에 앉아 완성한 HPI 텍스트**입니다. 지금까지는 환자와 대화한 내용을 머릿속에 기억했다가 나중에 차트로 옮겨 적는 방식이었기 때문에, 중간 단계의 키워드 기록은 존재하지 않습니다.

ChatGPT는 이 완성된 차트 텍스트들을 분석해 두 가지를 만들어냅니다:

1. **스키마 필드**: 이 C.C.에서 반복적으로 등장하는 임상 정보 항목들 (예: 발생 시점, 위치, 양상...)
2. **`inputs.category` 목록**: 앞으로 의사가 모바일로 입력할 키워드 카드가 어떤 종류에 해당할지 역으로 추론한 분류 체계

즉, `inputs` 배열은 **앞으로 이 서비스에서 생성될 카드 입력물**을 AI가 정규화할 때 쓰는 구조이며, ChatGPT는 과거 차트를 보고 "이런 카드들이 들어올 것이다"를 추론해서 설계해줍니다.

### ChatGPT 요청 방법 (C.C. 하나씩 반복)

**Step A: 실제 차팅 데이터 수집**

해당 C.C.의 완성된 HPI 차트 텍스트 10~20개를 수집합니다. 차팅 수가 많을수록 ChatGPT가 더 정확한 스키마를 만듭니다. 붙여넣기 전 개인정보를 반드시 제거하세요.

> **개인정보 제거 기준**: 날짜, 이름, 나이, 병록번호 삭제. 성별·연령대(예: "60대 남성")는 유지해도 무방합니다.

**Step B: ChatGPT에 아래 프롬프트를 붙여넣기**

```
아래는 응급실에서 실제로 작성된 [C.C. 이름] 환자의 완성된 HPI 차트 기록들이야.
이 차트들과 내가 함께 제공하는 상용구 템플릿을 분석해서,
이 C.C.에 특화된 JSON Schema draft-07을 만들어줘.

배경:
- 이 서비스는 의사가 모바일로 문진 중 키워드를 카드로 입력하면
  AI가 HPI와 상용구를 자동 생성해주는 시스템이야.
- 아래 차트들은 과거에 머릿속 기억으로 작성된 완성본이고,
  앞으로는 의사가 문진 중 입력한 키워드 카드를 AI가 이 스키마 형식으로 정규화할 거야.

배경 추가:
- AI는 총 4가지 결과물을 생성합니다: HPI 줄글, 상용구, History, 그리고 이 모두의 기반이 되는 structured JSON
- 의사가 입력한 각 키워드 카드는 HPI / 상용구 / History 중 하나 이상의 섹션에 해당할 수 있음
- History 섹션 구성: Past Hx., Med Hx., Op Hx. (항상 포함, 내용 없으면 (-)), Family Hx. (내용 있을 때만 포함)

조건:
1. 아래 차트들과 상용구에서 반복적으로 등장하는 임상 항목만 필드로 포함
2. 이 C.C.에서 임상적으로 의미 없는 항목은 제외
3. 각 필드의 type은 string, integer, array 중 적합한 것으로, null 허용
4. 필드마다 description은 한국어로
5. History 관련 최상위 필드 반드시 포함:
   - past_history (array of string, nullable)
   - medication_history (array of string, nullable)
   - operation_history (array of string, nullable)
   - family_history (array of string, nullable — 없으면 null, History 출력 시 제외)
6. "inputs" 배열은 아래 예시 구조를 반드시 포함
   - 의사가 카드로 입력할 수 있는 키워드 유형을 차트 내용에서 역으로 추론해
     inputs.category enum 값을 이 C.C.에 맞게 직접 제안해줘
   - 각 카드 항목에 sections 배열 추가: 해당 카드가 어느 섹션에 쓰이는지 분류
     (가능한 값: "hpi", "template", "history". 복수 선택 가능)
   - 어떤 카드 유형이 어느 섹션에 들어가야 하는지는 차트 데이터를 보고 판단해줘

---
[HPI 차트 텍스트 10~20개 붙여넣기]

---
[상용구 템플릿 붙여넣기 (Step 4에서 만든 파일)]

---
"inputs" 필드 예시 구조:
{
  "inputs": {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "raw_text": { "type": "string" },
        "normalized_text": { "type": "string" },
        "category": {
          "type": "string",
          "enum": ["...이 C.C.에 맞게 제안해줘..."]
        },
        "sections": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["hpi", "template", "history"]
          },
          "description": "이 카드가 사용될 섹션 목록. 복수 가능"
        }
      }
    }
  }
}
```

> **팁**: 차팅 데이터와 상용구 템플릿을 함께 제공할수록 ChatGPT가 실제로 필요한 필드를 더 잘 파악합니다. Step 4(상용구 템플릿)를 먼저 만들고 이 단계를 진행하는 것을 권장합니다.

**Step C: 결과물 저장**

ChatGPT가 생성한 JSON Schema를 해당 경로에 저장합니다.

| C.C.           | 저장 경로                                      |
| -------------- | ---------------------------------------------- |
| Chest pain     | `lib/ai/resources/schemas/chest-pain.json`     |
| Dyspnea        | `lib/ai/resources/schemas/dyspnea.json`        |
| Hemoptysis     | `lib/ai/resources/schemas/hemoptysis.json`     |
| Abdominal pain | `lib/ai/resources/schemas/abdominal-pain.json` |
| GI bleeding    | `lib/ai/resources/schemas/gi-bleeding.json`    |

**Step D: 검토 포인트**

- 실제 문진할 때 빠뜨리면 안 되는 항목이 모두 포함되어 있는지 확인
- 이 C.C.에 해당 없는 필드가 포함되어 있지 않은지 확인
- `inputs.category` enum 값이 실제 카드 유형을 잘 반영하는지 확인
- `inputs.sections` 분류가 자연스러운지 확인 — 예를 들어 과거력·복용약·수술력은 `history`에 속해야 하고, 증상 관련 카드는 `hpi`와 `template`에 속하는 것이 일반적
- `past_history`, `medication_history`, `operation_history`, `family_history` 최상위 필드가 포함되어 있는지 확인
- 필드가 너무 적으면 HPI가 빈약해지고, 너무 많으면 AI가 혼란스러워집니다

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

| 순서 | 파일                      | 시점                   | 난이도 | 비고                                               |
| ---- | ------------------------- | ---------------------- | ------ | -------------------------------------------------- |
| 1    | 언어 결정                 | **지금**               | —      | 모든 것의 기준                                     |
| 2    | `cc-list.json`            | **지금~1주**           | 쉬움   | 병원 C.C. 목록 기준                                |
| 3    | `schemas/{cc}.json` (5개) | **Phase 1~2 중**       | 어려움 | C.C.별 개별 작성, 차팅+상용구 제공 후 ChatGPT 활용 |
| 4    | `style_guide.md`          | Phase 1~2 중           | 쉬움   | 실제 차팅 예시 1~2개 포함                          |
| 5    | `templates/*.json`        | Phase 1~2 중           | 보통   | 형식 결정 후 EMR 참고                              |
| 6    | `guides/*.md`             | Phase 2 중             | 쉬움   | 5~10개                                             |
| 7    | `fixtures/`               | **Task 010 착수 직전** | 보통   | 익명화 케이스 2~3개                                |
| 8    | Gemini API 키             | Task 010 착수 직전     | —      | Google AI Studio에서 발급                          |

**ChatGPT 요청 권장 순서**: `cc-list.json` → `style_guide.md` → `templates/{cc}.json` → `schemas/{cc}.json` 순서로 진행하세요. 특히 스키마(`schemas/`)는 상용구 템플릿을 함께 제공할수록 정확도가 높아지므로, 템플릿을 먼저 완성한 뒤 진행하세요.
