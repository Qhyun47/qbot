# AI 리소스 추가 가이드

규봇에 새로운 C.C., 가이드라인, 상용구, 케이스 예시 데이터를 추가하는 방법을 설명합니다.
이 문서만 읽으면 Claude에게 다시 묻지 않고도 전체 프로세스를 진행할 수 있습니다.

---

## 전체 개요

규봇의 AI 리소스는 크게 네 가지입니다:

| 리소스                 | 역할                                               | 필수 여부                                |
| ---------------------- | -------------------------------------------------- | ---------------------------------------- |
| **C.C.**               | 자동완성 목록에 표시되는 주호소 항목               | C.C.가 없으면 아무것도 연결 불가         |
| **가이드라인**         | 문진 입력 화면 옆에 표시되는 문진 체크리스트       | 선택 (가이드라인만 단독으로도 존재 가능) |
| **상용구**             | AI가 채워주는 EMR 차팅 템플릿 (C.C., P/E, History) | 선택 (있으면 AI 차팅 품질이 크게 향상됨) |
| **케이스 예시 데이터** | AI 품질 검증용 실제 문진 시나리오                  | **상용구가 있는 C.C.에는 필수**          |

### 리소스 간 관계

```
C.C. (cc-list.json)
  ├── guideKeys[] → 가이드라인 파일 (ai-docs/cc/{key}/guide.html)
  └── templateKeys[] → 상용구 파일 (ai-docs/cc/{key}/template.json + schema.json)
                            └── 케이스 예시 데이터 (fixtures/{cc-key}-{n}.json)
```

---

## 핵심 파일 위치

| 파일                                  | 역할                                                            |
| ------------------------------------- | --------------------------------------------------------------- |
| `lib/ai/resources/cc-list.json`       | 정형 C.C. 단일 목록 (이 파일이 모든 것의 출발점)                |
| `lib/ai/resources/guide-list.json`    | **가이드라인 표시명 목록** (cc-list.json과 항상 동기화)         |
| `lib/ai/resources/template-list.json` | 상용구 표시명 목록 (cc-list.json과 항상 동기화)                 |
| `ai-docs/cc/{key}/guide.html`         | C.C.별 문진 가이드라인 HTML (HWP→HTML, processGuideHtml() 적용) |
| `ai-docs/cc/{key}/template.json`      | C.C.별 상용구 템플릿 (fields, pe, history 포함)                 |
| `ai-docs/cc/{key}/schema.json`        | C.C.별 AI 정규화 스키마 (JSON Schema draft-07)                  |
| `ai-docs/pending-matches.md`          | 가이드라인/상용구 없이 등록된 C.C. 추적 파일                    |
| `fixtures/{cc-key}-{n}.json`          | AI 품질 검증용 케이스 예시 데이터                               |

> **`guide-list.json`은 `template-list.json`과 동일하게 중요합니다.** 이 파일에 없는 가이드라인은 가이드라인 관리 페이지 드롭다운과 문진 패널 전체 목록에 표시되지 않습니다.

---

## 슬래시 커맨드 사용법

Claude에게 요청할 때는 아래 슬래시 커맨드를 사용하면 Claude가 전체 절차를 자동으로 따릅니다.

```
/cc Dizziness           ← C.C. 추가 (이름을 인자로 전달)
/guide dizziness        ← 가이드라인 추가 (파일 키를 인자로 전달)
/tmpl dizziness         ← 상용구 추가 (파일 키를 인자로 전달)
```

> **파일 키(key)**: `kebab-case` 영문 소문자. 예: `chest-pain`, `gi-bleeding`, `dizziness`

---

## 1단계: C.C. 추가 (`/cc`)

### 언제 사용하나요?

새로운 주호소를 자동완성 목록에 등록하고 싶을 때. 가이드라인/상용구 없이 이름만 먼저 등록해도 됩니다.

### Claude가 하는 일

1. `lib/ai/resources/cc-list.json` 읽어 중복 확인
2. `ai-docs/pending-matches.md` 읽어 기존 미매칭 항목 확인
3. 새 항목을 `cc-list.json`에 추가:
   ```json
   { "cc": "Dizziness", "guideKeys": [], "templateKeys": [] }
   ```
4. 가이드라인/상용구가 아직 없으면 `pending-matches.md`에 대기 항목 등록

### 표기 규칙

- **`cc` 필드**: Sentence case — 첫 단어 첫 글자만 대문자
  - ✅ `"Dizziness"`, `"Chest pain"`, `"GI bleeding"`
  - ❌ `"chest pain"`, `"Chest Pain"` (Title Case 금지)
- **의학 약어**는 원형 그대로 유지: `"GI bleeding"`, `"IV access problem"`
- **별칭(aliasOf)**: Hematemesis, Melena처럼 다른 C.C.의 별칭일 경우 `aliasOf` 필드 사용

### 예시 입력

```
/cc Dizziness
```

```
/cc Syncope
```

---

## 2단계: 가이드라인 추가 (`/guide`)

### 언제 사용하나요?

문진 입력 화면 옆에 표시할 문진 체크리스트, 감별진단, 위험신호가 준비됐을 때.

### Claude가 하는 일

1. `ai-docs/pending-matches.md` 읽어 매칭 가능한 C.C. 파악
2. `lib/ai/resources/cc-list.json` 읽어 기존 C.C. 확인
3. `lib/ai/resources/guide-list.json` 읽어 중복 확인
4. 사용자에게 HWP에서 내보낸 HTML을 요청 → `processGuideHtml()` 적용 후 `ai-docs/cc/{key}/guide.html` 저장
5. **`lib/ai/resources/guide-list.json`에 항목 추가** ← 이 단계가 없으면 UI에 표시되지 않음
   ```json
   { "guideKey": "dizziness", "displayName": "Dizziness" }
   ```
6. 적합한 C.C.와 매칭할지 사용자에게 확인
7. 매칭 확정 시 `cc-list.json`의 `guideKeys[]`에 키 추가
8. `pending-matches.md` 업데이트

### guide.html 파일 형식

HWP에서 "HTML로 저장"하여 내보낸 파일을 그대로 붙여넣으면 됩니다.
Claude가 `processGuideHtml()`을 적용해 래퍼 태그(`<html>`, `<head>`, `<body>`)와 배경색을 자동으로 제거한 뒤 저장합니다.

> 파일은 `ai-docs/cc/{key}/guide.html`로 저장됩니다.

### 준비물

HWP 문서를 HTML로 내보낸 파일이 있으면 해당 내용을 붙여넣으세요.
없는 경우 가이드라인 없이 C.C.만 등록해도 되며, 나중에 `/guide` 커맨드로 추가할 수 있습니다.

### 주의

가이드라인은 AI 차팅 파이프라인에 직접 영향을 주지 않습니다.
**케이스 예시 데이터가 필요하지 않습니다.**

### 예시 입력

```
/guide dizziness
```

---

## 3단계: 상용구 추가 (`/tmpl`)

### 언제 사용하나요?

AI가 채워주는 EMR 차팅 템플릿 (C.C. 서술, P/E 소견, 과거력)을 등록하고 싶을 때.
상용구가 있으면 AI 차팅의 완성도가 크게 높아집니다.

### Claude가 하는 일

1. `ai-docs/pending-matches.md`, `cc-list.json`, `template-list.json` 읽기
2. 기존 `chest-pain` 구조를 참조해 새 파일 구조 준비
3. 아래 항목들을 **순서대로** 사용자에게 요청
4. 파일 2개 생성:
   - `ai-docs/cc/{key}/template.json`
   - `ai-docs/cc/{key}/schema.json`
5. `lib/ai/resources/template-list.json`에 항목 추가
6. `cc-list.json`의 `templateKeys[]`에 키 추가
7. `pending-matches.md` 업데이트
8. 케이스 예시 데이터 요청

### 사용자에게 순서대로 제공해야 할 것

#### ① 상용구 양식 (C.C. 섹션)

AI가 채워줄 필드 목록과 기본 출력 포맷입니다.
기본값 상태 (아무것도 입력하지 않았을 때)의 출력 결과를 그대로 붙여넣으세요.

예시 (chest-pain):

```
NTG response?
ongoing?

* Chest pain
Onset :
Duration :
Location :
Character :
Asso. Sx. :
Radiating pain :
Resting pain :
Exertional pain :

Agg.relieving factor :

F/C(-/-)  C/S/R(-/-/-)  A/N/V/D/C(-/-/-/-/-)
```

#### ② P/E 양식 (신체검진 섹션)

신체검진 소견 기본값 출력 포맷입니다.

예시 (chest-pain):

```
Vital stable, Mental alert
Chest tenderness (-)
Lung sound : clear
Abdominal tenderness (-)
Pitting edema (-)
```

#### ③ History 양식 (과거력 섹션)

과거력 기본값 출력 포맷입니다.

예시 (chest-pain):

```
CAG Hx:
Past Hx:
Med Hx:
Op Hx:
Allergy Hx:
Alcohol:     , Smoking:

FHx. : Cardiac(-),Stroke(-),Cancer(-)
최근 스트레스 :
```

### template.json 파일 구조

```json
{
  "templateKey": "dizziness",
  "cc": "Dizziness",
  "description": "어지러움 환자 EMR 상용구 템플릿",
  "instructions": "...",
  "fields": [
    {
      "key": "onset",
      "label": "Onset",
      "type": "open",
      "description": "증상 발생 시점. 없으면 빈 문자열."
    },
    {
      "key": "fever_chill",
      "label": "F/C",
      "type": "symptom_check",
      "format": "F/C({fever}/{chill})",
      "slots": [
        { "key": "fever", "symptom": "Fever", "description": "발열", "default": "-" },
        { "key": "chill", "symptom": "Chill", "description": "오한", "default": "-" }
      ],
      "description": "발열/오한. 언급 없으면 기본값(-) 유지."
    }
  ],
  "output_example": "...",
  "pe": {
    "fields": [...],
    "output_example": "..."
  },
  "history": {
    "fields": [...],
    "output_example": "..."
  }
}
```

#### field type 설명

| type            | 설명              | AI 동작                                             |
| --------------- | ----------------- | --------------------------------------------------- |
| `open`          | 자유 서술형       | 관련 정보 있으면 채움, 없으면 빈 문자열             |
| `symptom_check` | `+`/`-` 체크 그룹 | 명시적 언급 있을 때만 `+`, 나머지는 반드시 `-` 유지 |

실제 예시: `ai-docs/cc/chest-pain/template.json` 참조

---

## 4단계: 케이스 예시 데이터 추가

### 언제 필요한가요?

**상용구(`templateKeys`)가 있는 C.C.에만 필수입니다.**
가이드라인만 있고 상용구가 없는 C.C.에는 불필요합니다.

상용구 추가가 완료되면 Claude가 자동으로 요청합니다.

### 파일 위치 및 형식

- 위치: `fixtures/{cc-key}-{n}.json` (예: `fixtures/dizziness-01.json`)
- 번호: `01`부터 시작, 케이스 1개당 파일 1개

### fixtures 파일 구조

```json
{
  "case": {
    "cc": "Dizziness",
    "bedZone": "A",
    "bedNumber": 1
  },
  "inputs": [
    {
      "rawText": "2일 전부터 시작",
      "timeTag": "2일 전",
      "timeOffsetMinutes": -2880
    },
    {
      "rawText": "걸을 때 심해짐",
      "timeTag": null,
      "timeOffsetMinutes": null
    },
    {
      "rawText": "오심 동반",
      "timeTag": null,
      "timeOffsetMinutes": null
    }
  ]
}
```

#### 필드 설명

| 필드                         | 설명                                                    |
| ---------------------------- | ------------------------------------------------------- |
| `case.cc`                    | C.C. 이름 (cc-list.json과 일치해야 함)                  |
| `case.bedZone`               | 구역 (`A` / `B` / `R`)                                  |
| `case.bedNumber`             | 베드 번호                                               |
| `inputs[].rawText`           | 의사가 실제 입력할 키워드 카드 내용                     |
| `inputs[].timeTag`           | 시간 표현 (`"3일 전"`, `"오늘 오전"` 등, 없으면 `null`) |
| `inputs[].timeOffsetMinutes` | 시간 오프셋 분 단위 (3일 전 = `-4320`, 없으면 `null`)   |

### 검증 실행

파일을 받으면 Claude가 즉시 아래 명령으로 AI 파이프라인을 돌려 품질을 확인합니다:

```bash
npx tsx --env-file=.env.local scripts/ai-harness.ts fixtures/dizziness-01.json
```

출력 결과를 보고 HPI, 상용구 채움, History가 제대로 나오는지 확인합니다.

---

## 추천 추가 순서

새 C.C.를 처음부터 완전히 추가할 때의 권장 순서입니다:

```
1. /cc Dizziness            ← 이름 등록 (필수, 가장 먼저)
2. /guide dizziness         ← 가이드라인 (순서 무관, 상용구 전에 해도 됨)
3. /tmpl dizziness          ← 상용구 (P/E, History 양식 준비 필요)
4. 케이스 예시 데이터 제공   ← 상용구 완료 직후 Claude가 요청함
```

단계별로 따로따로 추가해도 됩니다.
중간에 멈춰도 `ai-docs/pending-matches.md`가 미완성 항목을 추적합니다.

---

## 주의사항 및 규칙 요약

### cc-list.json 표기 규칙

```json
{ "cc": "Dizziness",       ← Sentence case (첫 글자만 대문자)
  "guideKeys": ["dizziness"],
  "templateKeys": ["dizziness"] }
```

### guide-list.json 동기화 규칙

`guideKeys`에 키를 추가하거나 삭제할 때마다 `guide-list.json`도 **항상** 동기화합니다.

```json
{ "guideKey": "dizziness", "displayName": "Dizziness" }
```

이 파일을 업데이트하지 않으면:

- 가이드라인 관리 페이지의 드롭다운 목록에 표시되지 않음
- 문진 패널 가이드라인 선택기의 "전체 목록"에 표시되지 않음
- 관리자 리소스 현황 페이지에서 displayName이 키 이름 그대로 나타남

### template-list.json 동기화 규칙

`templateKeys`에 키를 추가하거나 삭제할 때마다 `template-list.json`도 **항상** 동기화합니다.

```json
{ "templateKey": "dizziness", "displayName": "Dizziness" }
```

### pending-matches.md 확인 규칙

가이드라인 또는 상용구를 추가할 때 Claude는 **반드시** `pending-matches.md`를 먼저 읽고,
새로 추가하는 리소스와 매칭 가능한 미매칭 C.C.가 있으면 사용자에게 매칭 여부를 묻습니다.

---

## 현재 등록된 리소스 현황

> 이 섹션은 수동으로 업데이트하거나, `lib/ai/resources/cc-list.json`과 `template-list.json`을 직접 확인하세요.

| C.C.           | 가이드라인        | 상용구            | 비고                 |
| -------------- | ----------------- | ----------------- | -------------------- |
| Chest pain     | ✅ chest-pain     | ✅ chest-pain     |                      |
| Dyspnea        | ✅ dyspnea        | ✅ dyspnea        |                      |
| Hemoptysis     | ✅ hemoptysis     | ✅ hemoptysis     |                      |
| Abdominal pain | ✅ abdominal-pain | ✅ abdominal-pain |                      |
| GI bleeding    | ✅ gi-bleeding    | ✅ gi-bleeding    |                      |
| Hematemesis    | -                 | -                 | aliasOf: GI bleeding |
| Melena         | -                 | -                 | aliasOf: GI bleeding |
| Hematochezia   | -                 | -                 | aliasOf: GI bleeding |
