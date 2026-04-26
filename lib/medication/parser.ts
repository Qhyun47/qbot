export interface Medication {
  date: string;
  drugName: string;
  count: string;
  unit: string;
  frequency: string;
  days: number;
  rawDetails: string;
}

const UNITS = [
  "정",
  "캡슐",
  "cap",
  "tab",
  "ml",
  "관",
  "병",
  "포",
  "g",
  "mg",
  "회",
  "vial",
  "amp",
  "ea",
  "pouch",
];

// KST 기준으로 처방 종료 여부 판단
function isMedicationActive(dateStr: string, days: number): boolean {
  try {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const startDate = new Date(year, month, day);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days);

    const kstDateStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Seoul",
    });
    const [y, m, d] = kstDateStr.split("-").map(Number);
    const today = new Date(y, m - 1, d);

    return endDate > today;
  } catch {
    return false;
  }
}

// EMR 원문 텍스트를 파싱하여 Medication 배열과 날짜 없음 플래그를 반환
export function parseMedicationText(raw: string): {
  medications: Medication[];
  firstLineStartsNoDate: boolean;
} {
  const lines = raw.split("\n").filter((l) => l.trim());
  const medications: Medication[] = [];
  let lastDate = "";

  let firstLineStartsNoDate = false;
  if (lines.length > 0) {
    const firstLineParts = lines[0].trim().split(/\s+/);
    if (firstLineParts.length > 0 && !/^\d{8}$/.test(firstLineParts[0])) {
      firstLineStartsNoDate = true;
    }
  }

  lines.forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 1) return;

    let date = "";
    let drugInfoStart = 0;

    if (/^\d{8}$/.test(parts[0])) {
      date = parts[0];
      lastDate = date;
      drugInfoStart = 1;
      // 날짜 다음에 EDI 코드(7~10자리 숫자)가 오면 건너뜀
      if (parts.length > 1 && /^\d{7,10}$/.test(parts[1])) {
        drugInfoStart = 2;
      }
    } else if (/^\d{10,15}$/.test(parts[0])) {
      // 처방 번호로 시작하는 경우 — 날짜 없음
      date = lastDate;
      drugInfoStart = 1;
    } else {
      date = lastDate;
      if (/^\d{7,10}$/.test(parts[0])) {
        drugInfoStart = 1;
      } else {
        drugInfoStart = 0;
      }
    }

    // 약물명 끝 위치를 역순으로 탐색
    let drugInfoEnd = parts.length;
    let foundPrescriptionStart = -1;

    for (let i = parts.length - 1; i >= drugInfoStart; i--) {
      const p = parts[i].toLowerCase();
      const isNumeric = /^\d+(\.\d+)?$/.test(p);
      const isUnit = UNITS.some((u) => p === u || p.endsWith(u));
      const isNumericWithUnit = /^\d+(\.\d+)?[가-힣a-zA-Z]+/.test(p);

      if (isNumeric || isUnit || isNumericWithUnit) {
        foundPrescriptionStart = i;
      } else {
        break;
      }
    }

    if (
      foundPrescriptionStart !== -1 &&
      foundPrescriptionStart > drugInfoStart
    ) {
      drugInfoEnd = foundPrescriptionStart;
    }

    const drugInfo = parts.slice(drugInfoStart, drugInfoEnd).join(" ");
    if (!drugInfo) return;

    let count = "";
    let unit = "";
    let frequency = "";
    let days = 1;
    let rawDetails = "";

    if (foundPrescriptionStart !== -1) {
      let detailParts = parts.slice(foundPrescriptionStart);

      // 마지막 파트가 EDI 코드 형태면 제거
      if (detailParts.length > 1) {
        const lastPart = detailParts[detailParts.length - 1];
        const isSimpleNumber = /^\d+$/.test(lastPart);
        const isSimpleUnit = UNITS.some((u) => lastPart.toLowerCase() === u);
        if (!isSimpleNumber && !isSimpleUnit) {
          detailParts = detailParts.slice(0, -1);
        }
      }

      rawDetails = detailParts.join(" ");

      const numericParts = detailParts.filter((p) => /^\d+(\.\d+)?$/.test(p));
      const unitPart = detailParts.find(
        (p) =>
          UNITS.some((u) => p.toLowerCase().includes(u)) && !/^\d+$/.test(p)
      );

      if (numericParts.length >= 3) {
        count = numericParts[0];
        frequency = numericParts[1];
        days = parseInt(numericParts[2]);
        unit = unitPart ?? "";
      } else if (numericParts.length === 2) {
        frequency = numericParts[0];
        days = parseInt(numericParts[1]);
        const remaining = detailParts.filter((p) => !numericParts.includes(p));
        if (remaining.length > 0) {
          const unitMatch = remaining[0].match(/^(\d+(?:\.\d+)?)(.*)$/);
          if (unitMatch) {
            count = unitMatch[1];
            unit = unitMatch[2] ?? "";
          } else {
            unit = remaining[0];
          }
        }
      } else if (numericParts.length === 1) {
        days = parseInt(numericParts[0]);
      }
    }

    medications.push({
      date,
      drugName: drugInfo,
      count,
      unit,
      frequency,
      days,
      rawDetails,
    });
  });

  return { medications, firstLineStartsNoDate };
}

// KST 기준 복용 종료 약물 필터링
export function filterActiveMedications(
  medications: Medication[],
  active: boolean,
  firstLineStartsNoDate: boolean
): Medication[] {
  return medications.filter((m) => {
    if (!active) return true;
    if (firstLineStartsNoDate) return true;
    if (!m.date) return true;
    return isMedicationActive(m.date, m.days);
  });
}

// 중복 제거 (같은 날짜 + 같은 약물명)
export function removeDuplicates(medications: Medication[]): Medication[] {
  return medications.filter(
    (med, index, self) =>
      index ===
      self.findIndex((t) => t.date === med.date && t.drugName === med.drugName)
  );
}

// 토글 옵션에 따라 출력 텍스트 생성
export function formatMedicationOutput(
  medications: Medication[],
  opts: { includeDetails: boolean; firstLineStartsNoDate: boolean }
): string {
  const formatMedLine = (m: Medication): string => {
    if (opts.includeDetails && m.rawDetails) {
      return `${m.drugName} ${m.rawDetails}`;
    }
    return m.drugName;
  };

  if (opts.firstLineStartsNoDate) {
    return medications.map((m) => formatMedLine(m)).join("\n");
  }

  const groups: { date: string; meds: string[] }[] = [];
  let currentGroup: { date: string; meds: string[] } | null = null;

  medications.forEach((m) => {
    const medLine = formatMedLine(m);
    if (m.date) {
      if (!currentGroup || currentGroup.date !== m.date) {
        currentGroup = { date: m.date, meds: [] };
        groups.push(currentGroup);
      }
      currentGroup.meds.push(medLine);
    } else {
      if (!currentGroup || currentGroup.date !== "") {
        currentGroup = { date: "", meds: [] };
        groups.push(currentGroup);
      }
      currentGroup.meds.push(medLine);
    }
  });

  return groups
    .map((group) => {
      if (group.date) {
        const yy = group.date.substring(2, 4);
        const mm = group.date.substring(4, 6);
        const dd = group.date.substring(6, 8);
        return `[${yy}.${mm}.${dd} med]\n${group.meds.join("\n")}`;
      }
      return group.meds.join("\n");
    })
    .join("\n\n");
}

// 편의 함수: 파싱 → 필터 → 중복제거 → 포맷을 한 번에 처리
export function processMedicationText(
  raw: string,
  opts: { filterActive: boolean; includeDetails: boolean }
): string {
  if (!raw.trim()) return "";

  const { medications, firstLineStartsNoDate } = parseMedicationText(raw);
  if (medications.length === 0)
    return "표시할 약물 목록이 없습니다. 입력 형식을 확인해주세요.";

  const filtered = filterActiveMedications(
    medications,
    opts.filterActive,
    firstLineStartsNoDate
  );
  if (filtered.length === 0)
    return "현재 복용 중인(유효 기간 내) 약물이 없습니다.";

  const unique = removeDuplicates(filtered);
  return formatMedicationOutput(unique, {
    includeDetails: opts.includeDetails,
    firstLineStartsNoDate,
  });
}
