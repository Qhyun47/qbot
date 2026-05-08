"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

type Period = "AM" | "PM";

interface TimeInputProps {
  value?: string; // "HH:MM" 24h format or ""
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

function to12h(hh24: string): { hours: string; period: Period } {
  const h = parseInt(hh24, 10);
  if (h === 0) return { hours: "12", period: "AM" };
  if (h < 12) return { hours: String(h).padStart(2, "0"), period: "AM" };
  if (h === 12) return { hours: "12", period: "PM" };
  return { hours: String(h - 12).padStart(2, "0"), period: "PM" };
}

function to24h(h12: number, period: Period): number {
  if (period === "AM") return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

// 12 이하 숫자 입력 시 현재 시각 기준으로 더 가까운 오전/오후 자동 감지
function detectNearestPeriod(h12: number, m: number): Period {
  const now = new Date();
  const nowTotal = now.getHours() * 60 + now.getMinutes();
  const amTotal = to24h(h12, "AM") * 60 + m;
  const pmTotal = to24h(h12, "PM") * 60 + m;
  const diffAM =
    amTotal > nowTotal ? amTotal - nowTotal : amTotal - nowTotal + 24 * 60;
  const diffPM =
    pmTotal > nowTotal ? pmTotal - nowTotal : pmTotal - nowTotal + 24 * 60;
  return diffAM <= diffPM ? "AM" : "PM";
}

function parseValue(v: string) {
  if (!v) return { hours: "", minutes: "", period: "AM" as Period };
  const parts = v.split(":");
  const { hours, period } = to12h(parts[0] ?? "00");
  return { hours, minutes: parts[1] ?? "", period };
}

export function TimeInput({
  value = "",
  onChange,
  className,
  disabled,
}: TimeInputProps) {
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value ?? "");

  const [hours, setHours] = useState(() => parseValue(value).hours);
  const [minutes, setMinutes] = useState(() => parseValue(value).minutes);
  const [period, setPeriod] = useState<Period>(() => parseValue(value).period);

  useEffect(() => {
    if ((value ?? "") === lastEmitted.current) return;
    lastEmitted.current = value ?? "";
    const parsed = parseValue(value ?? "");
    setHours(parsed.hours);
    setMinutes(parsed.minutes);
    setPeriod(parsed.period);
  }, [value]);

  function commit(h: string, m: string, p: Period) {
    const newVal =
      h.length === 2 && m.length === 2
        ? `${String(to24h(Number(h), p)).padStart(2, "0")}:${m}`
        : "";
    if (newVal === lastEmitted.current) return;
    lastEmitted.current = newVal;
    onChange?.(newVal);
  }

  function processHoursInput(raw: string) {
    const digits = raw.replace(/\D/g, "");

    if (digits === "") {
      setHours("");
      commit("", minutes, period);
      return;
    }

    if (digits.length === 1) {
      const d = Number(digits);
      if (d >= 2) {
        // 2–9: 앞에 0 붙여 완성, 오전/오후 자동 감지
        const h = "0" + d;
        const p = detectNearestPeriod(d, minutes ? Number(minutes) : 0);
        setHours(h);
        setPeriod(p);
        commit(h, minutes, p);
        minutesRef.current?.focus();
        minutesRef.current?.select();
      } else {
        // 0, 1: 두 번째 자리 대기
        setHours(digits);
      }
      return;
    }

    const two = digits.slice(-2);
    const val = Number(two);

    if (val >= 1 && val <= 12) {
      // 유효한 12시간제 값 → 오전/오후 자동 감지
      const h = String(val).padStart(2, "0");
      const p = detectNearestPeriod(val, minutes ? Number(minutes) : 0);
      setHours(h);
      setPeriod(p);
      commit(h, minutes, p);
      minutesRef.current?.focus();
      minutesRef.current?.select();
    } else if (val >= 13 && val <= 23) {
      // 13–23 입력 시 오후로 자동 변환 (예: 15 → 오후 3시)
      const h12 = val - 12;
      const h = String(h12).padStart(2, "0");
      setHours(h);
      setPeriod("PM");
      commit(h, minutes, "PM");
      minutesRef.current?.focus();
      minutesRef.current?.select();
    } else {
      // 0 또는 24 초과: 마지막 한 자리로 재시작
      const lastD = Number(digits.slice(-1));
      if (lastD >= 2) {
        const h = "0" + lastD;
        const p = detectNearestPeriod(lastD, minutes ? Number(minutes) : 0);
        setHours(h);
        setPeriod(p);
        commit(h, minutes, p);
        minutesRef.current?.focus();
        minutesRef.current?.select();
      } else {
        setHours(String(lastD));
      }
    }
  }

  function processMinutesInput(raw: string) {
    const digits = raw.replace(/\D/g, "");

    if (digits === "") {
      setMinutes("");
      commit(hours, "", period);
      return;
    }

    if (digits.length === 1) {
      const d = Number(digits);
      if (d >= 6) {
        const m = "0" + d;
        setMinutes(m);
        commit(hours, m, period);
      } else {
        setMinutes(digits);
      }
      return;
    }

    const two = digits.slice(-2);
    const val = Number(two);
    if (val <= 59) {
      const m = two.padStart(2, "0");
      setMinutes(m);
      commit(hours, m, period);
    } else {
      const lastD = Number(digits.slice(-1));
      if (lastD >= 6) {
        const m = "0" + lastD;
        setMinutes(m);
        commit(hours, m, period);
      } else {
        setMinutes(String(lastD));
      }
    }
  }

  function handleHoursKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab") return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = hours.length === 2 ? Number(hours) : 12;
      const next = current === 12 ? 1 : current + 1;
      const h = String(next).padStart(2, "0");
      setHours(h);
      commit(h, minutes, period);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = hours.length === 2 ? Number(hours) : 1;
      const next = current === 1 ? 12 : current - 1;
      const h = String(next).padStart(2, "0");
      setHours(h);
      commit(h, minutes, period);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      setHours("");
      commit("", minutes, period);
      return;
    }

    if (e.key >= "0" && e.key <= "9" && hours.length === 2) {
      e.currentTarget.select();
    }
  }

  function handleMinutesKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      hoursRef.current?.focus();
      hoursRef.current?.select();
      return;
    }
    if (e.key === "Tab") return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = minutes.length === 2 ? Number(minutes) : 0;
      const m = String((current + 1) % 60).padStart(2, "0");
      setMinutes(m);
      commit(hours, m, period);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = minutes.length === 2 ? Number(minutes) : 0;
      const m = String((current - 1 + 60) % 60).padStart(2, "0");
      setMinutes(m);
      commit(hours, m, period);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      setMinutes("");
      commit(hours, "", period);
      return;
    }

    if (e.key >= "0" && e.key <= "9" && minutes.length === 2) {
      e.currentTarget.select();
    }
  }

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    commit(hours, minutes, p);
  }

  const segmentClass = cn(
    "w-8 bg-transparent text-center text-base tabular-nums outline-none",
    "placeholder:text-muted-foreground",
    "rounded-sm transition-colors",
    "focus:bg-primary/10 focus:text-primary"
  );

  return (
    <div
      role="group"
      aria-label="시간 입력"
      className={cn(
        "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2",
        "ring-offset-background transition-colors",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div className="flex flex-1 items-center">
        <input
          ref={hoursRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={hours}
          placeholder="--"
          disabled={disabled}
          maxLength={2}
          aria-label="시"
          onChange={(e) => processHoursInput(e.target.value)}
          onKeyDown={handleHoursKeyDown}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.currentTarget.select()}
          className={segmentClass}
        />
        <span className="select-none px-0.5 text-muted-foreground">:</span>
        <input
          ref={minutesRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={minutes}
          placeholder="--"
          disabled={disabled}
          maxLength={2}
          aria-label="분"
          onChange={(e) => processMinutesInput(e.target.value)}
          onKeyDown={handleMinutesKeyDown}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.currentTarget.select()}
          className={segmentClass}
        />
      </div>

      {/* 오전/오후 토글 */}
      <div className="ml-2 flex shrink-0 overflow-hidden rounded border border-input">
        {(["AM", "PM"] as const).map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => handlePeriodChange(p)}
            className={cn(
              "px-2.5 py-0.5 text-xs font-medium transition-colors",
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {p === "AM" ? "오전" : "오후"}
          </button>
        ))}
      </div>
    </div>
  );
}
