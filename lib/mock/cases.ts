import type { Case, CaseInput, CaseResult } from "@/lib/supabase/types";

export const MOCK_CASES: Case[] = [
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    user_id: "00000000-0000-4000-8000-000000000000",
    bed_zone: "A",
    bed_number: 3,
    cc: "Chest pain",
    ccs: ["Chest pain"],
    cc_has_template: true,
    template_key: "chest-pain",
    template_keys: ["chest-pain"],
    status: "completed",
    current_result_id: "r1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    memo: null,
    has_inputs: true,
    bed_explicitly_set: true,
    board_hidden_at: null,
    created_at: "2026-04-19T06:00:00.000Z",
    updated_at: "2026-04-19T06:15:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000002",
    user_id: "00000000-0000-4000-8000-000000000000",
    bed_zone: "B",
    bed_number: 7,
    cc: "Dyspnea",
    ccs: ["Dyspnea"],
    cc_has_template: true,
    template_key: "dyspnea",
    template_keys: ["dyspnea"],
    status: "completed",
    current_result_id: "r1b2c3d4-e5f6-4a7b-8c9d-000000000002",
    memo: null,
    has_inputs: true,
    bed_explicitly_set: true,
    board_hidden_at: null,
    created_at: "2026-04-19T05:30:00.000Z",
    updated_at: "2026-04-19T05:45:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000003",
    user_id: "00000000-0000-4000-8000-000000000000",
    bed_zone: "R",
    bed_number: 2,
    cc: "GI bleeding",
    ccs: ["GI bleeding"],
    cc_has_template: true,
    template_key: "gi-bleeding",
    template_keys: ["gi-bleeding"],
    status: "generating",
    current_result_id: null,
    memo: null,
    has_inputs: true,
    bed_explicitly_set: true,
    board_hidden_at: null,
    created_at: "2026-04-19T07:00:00.000Z",
    updated_at: "2026-04-19T07:02:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000004",
    user_id: "00000000-0000-4000-8000-000000000000",
    bed_zone: "A",
    bed_number: 1,
    cc: "Abdominal pain",
    ccs: ["Abdominal pain"],
    cc_has_template: true,
    template_key: "abdominal-pain",
    template_keys: ["abdominal-pain"],
    status: "failed",
    current_result_id: null,
    memo: null,
    has_inputs: true,
    bed_explicitly_set: true,
    board_hidden_at: null,
    created_at: "2026-04-19T04:00:00.000Z",
    updated_at: "2026-04-19T04:10:00.000Z",
  },
  {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000005",
    user_id: "00000000-0000-4000-8000-000000000000",
    bed_zone: "B",
    bed_number: 11,
    cc: "Hemoptysis",
    ccs: ["Hemoptysis"],
    cc_has_template: true,
    template_key: "hemoptysis",
    template_keys: ["hemoptysis"],
    status: "draft",
    current_result_id: null,
    memo: null,
    has_inputs: true,
    bed_explicitly_set: true,
    board_hidden_at: null,
    created_at: "2026-04-19T07:30:00.000Z",
    updated_at: "2026-04-19T07:30:00.000Z",
  },
];

export const MOCK_CASE_INPUTS: CaseInput[] = [
  {
    id: "i1000000-0000-4000-8000-000000000001",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    raw_text: "3일 전부터 흉통 시작, 갑자기 발생",
    time_tag: "3일 전",
    time_offset_minutes: 4320,
    section_override: null,
    display_order: 1,
    created_at: "2026-04-19T06:01:00.000Z",
  },
  {
    id: "i1000000-0000-4000-8000-000000000002",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    raw_text: "어제 저녁 NTG 투여 후에도 통증 지속",
    time_tag: "어제",
    time_offset_minutes: 1440,
    section_override: null,
    display_order: 2,
    created_at: "2026-04-19T06:02:00.000Z",
  },
  {
    id: "i1000000-0000-4000-8000-000000000003",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    raw_text: "2시간 전부터 left arm radiation 동반",
    time_tag: "2시간 전",
    time_offset_minutes: 120,
    section_override: null,
    display_order: 3,
    created_at: "2026-04-19T06:03:00.000Z",
  },
  {
    id: "i1000000-0000-4000-8000-000000000004",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    raw_text: "30분 전부터 diaphoresis 발생",
    time_tag: "30분 전",
    time_offset_minutes: 30,
    section_override: null,
    display_order: 4,
    created_at: "2026-04-19T06:04:00.000Z",
  },
  {
    id: "i1000000-0000-4000-8000-000000000005",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    raw_text: "HTN, DM 기저질환 있음. 이전 PCI 이력",
    time_tag: null,
    time_offset_minutes: null,
    section_override: null,
    display_order: 5,
    created_at: "2026-04-19T06:05:00.000Z",
  },
  {
    id: "i1000000-0000-4000-8000-000000000006",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    raw_text: "NRS 8점, squeezing 양상, substernal",
    time_tag: null,
    time_offset_minutes: null,
    section_override: null,
    display_order: 6,
    created_at: "2026-04-19T06:06:00.000Z",
  },
  {
    id: "i1000000-0000-4000-8000-000000000007",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000003",
    raw_text: "내원 1시간 전부터 hematemesis 3회",
    time_tag: "1시간 전",
    time_offset_minutes: 60,
    section_override: null,
    display_order: 1,
    created_at: "2026-04-19T07:01:00.000Z",
  },
  {
    id: "i1000000-0000-4000-8000-000000000008",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000003",
    raw_text: "어제부터 melena 지속",
    time_tag: "어제",
    time_offset_minutes: 1440,
    section_override: null,
    display_order: 2,
    created_at: "2026-04-19T07:01:30.000Z",
  },
  {
    id: "i1000000-0000-4000-8000-000000000009",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000003",
    raw_text: "HTN, ASA 복용 중",
    time_tag: null,
    time_offset_minutes: null,
    section_override: null,
    display_order: 3,
    created_at: "2026-04-19T07:02:00.000Z",
  },
];

export const MOCK_CASE_RESULTS: CaseResult[] = [
  {
    id: "r1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
    pi_draft:
      "65세 남자 환자로 3일 전부터 substernal chest pain이 발생하여 내원하였습니다. " +
      "통증은 squeezing 양상으로 NRS 8점이며, left arm radiation을 동반합니다. " +
      "어제 저녁 NTG를 투여하였으나 통증이 지속되었으며, 30분 전부터 diaphoresis가 발생하였습니다. " +
      "기저질환으로 HTN, DM이 있으며 이전 PCI 시행 이력이 있습니다.",
    pi_edited: null,
    template_draft:
      "Onset: 3일 전, 갑자기 발생\n" +
      "Duration: 지속적\n" +
      "Character: Squeezing, pressure-like\n" +
      "Location: Substernal\n" +
      "Radiation: Left arm\n" +
      "Severity: NRS 8/10\n" +
      "Aggravating factor: 안정 시에도 지속\n" +
      "Relieving factor: NTG 무반응\n" +
      "Associated sx: Diaphoresis (+), Dyspnea (-), Nausea (-)\n" +
      "PMHx: HTN, DM / 이전 PCI 이력",
    template_edited: null,
    pe_draft:
      "General : Alert, oriented\n" +
      "V/S : BP 142/88 mmHg  PR 98/min  RR 18/min  BT 36.8°C  SpO2 97%\n" +
      "HEENT : Not anemic conjunctiva, anicteric sclera\n" +
      "Neck : No JVD\n" +
      "Chest : Clear breathing sound bilaterally, no wheezing, no crackle\n" +
      "        No dullness on percussion\n" +
      "Heart : Regular rate and rhythm, no murmur\n" +
      "Abdomen : Soft, non-tender, no organomegaly\n" +
      "Extremities : No pitting edema",
    pe_edited: null,
    template_key_used: "chest-pain",
    template_keys_used: ["chest-pain"],
    model_version: "gemini-2.0-flash",
    structured_json: {},
    error_message: null,
    history_draft:
      "Past Hx. : HTN, DM / 이전 PCI 이력\n" +
      "Med Hx. : ASA, metformin 복용 중\n" +
      "Op Hx. : PCI (2022)\n" +
      "Family Hx. : 부친 AMI",
    history_edited: null,
    generated_at: "2026-04-19T06:15:00.000Z",
    antithrombotic_check: null,
    antithrombotic_at: null,
    underlying_disease: null,
    underlying_disease_at: null,
  },
  {
    id: "r1b2c3d4-e5f6-4a7b-8c9d-000000000004",
    case_id: "a1b2c3d4-e5f6-4a7b-8c9d-000000000004",
    pi_draft: "",
    pi_edited: null,
    template_draft: "",
    template_edited: null,
    pe_draft: "",
    pe_edited: null,
    template_key_used: "abdominal-pain",
    template_keys_used: ["abdominal-pain"],
    model_version: "gemini-2.0-flash",
    structured_json: {},
    error_message: "AI 생성 중 오류가 발생했습니다. API 응답 없음.",
    history_draft: "Past Hx. : (-)\nMed Hx. : (-)\nOp Hx. : (-)",
    history_edited: null,
    generated_at: "2026-04-19T04:10:00.000Z",
    antithrombotic_check: null,
    antithrombotic_at: null,
    underlying_disease: null,
    underlying_disease_at: null,
  },
];

export const MOCK_GUIDE_CONTENT = `# Chest Pain 문진 가이드

## 핵심 문진 항목

### 통증 특성
- [ ] Onset: 언제부터? 갑자기(acute) vs 서서히(gradual)?
- [ ] Duration: 얼마나 지속? 간헐적 vs 지속적?
- [ ] Location: 어디가 아픈가? (left chest / substernal / right chest)
- [ ] Character: 어떻게 아픈가? (squeezing / pressure / sharp / burning / stabbing)
- [ ] Radiation: 방사통 있는가? (left arm / jaw / back / shoulder)
- [ ] Severity: NRS 몇 점?

### 상황적 특성
- [ ] Resting pain: 쉬고 있을 때도 아픈가?
- [ ] Exertional pain: 움직이면 더 아픈가?
- [ ] Aggravating/relieving factor: 악화/완화 요인?
- [ ] NTG response: NTG 투여했는가? 효과 있었는가?
- [ ] Ongoing: 지금도 아픈가?

### 동반 증상
- [ ] Dyspnea
- [ ] Diaphoresis (식은땀)
- [ ] Nausea / Vomiting
- [ ] Palpitation
- [ ] Syncope / Presyncope

### 과거력 및 위험인자
- [ ] HTN, DM, Dyslipidemia, Smoking
- [ ] 이전 ACS / CAG / PCI / CABG 이력
- [ ] 이전 유사 에피소드

---

## 위험 신호 (즉시 확인)

- Diaphoresis + chest pain → ACS 강력 의심
- Radiation to left arm / jaw → ACS
- Sudden tearing pain + HTN 기저 → Aortic dissection
- Hypotension + tachycardia → 심인성 쇼크
- New resting pain → Unstable angina`;
