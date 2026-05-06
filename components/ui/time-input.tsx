"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value?: string; // "HH:MM" or ""
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
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

  const [hours, setHours] = useState(() => (value ? value.slice(0, 2) : ""));
  const [minutes, setMinutes] = useState(() =>
    value ? value.slice(3, 5) : ""
  );

  // 외부 value 변경(폼 리셋 등)을 로컬 상태에 반영
  useEffect(() => {
    if ((value ?? "") === lastEmitted.current) return;
    lastEmitted.current = value ?? "";
    if (!value) {
      setHours("");
      setMinutes("");
    } else {
      setHours(value.slice(0, 2));
      setMinutes(value.slice(3, 5));
    }
  }, [value]);

  function commit(h: string, m: string) {
    const newVal = h.length === 2 && m.length === 2 ? `${h}:${m}` : "";
    if (newVal === lastEmitted.current) return;
    lastEmitted.current = newVal;
    onChange?.(newVal);
  }

  function processHoursInput(raw: string) {
    const digits = raw.replace(/\D/g, "");

    if (digits === "") {
      setHours("");
      commit("", minutes);
      return;
    }

    if (digits.length === 1) {
      const d = Number(digits);
      if (d >= 3) {
        // 3–9 → 자동 완성 후 분으로 이동
        const h = "0" + d;
        setHours(h);
        commit(h, minutes);
        minutesRef.current?.focus();
        minutesRef.current?.select();
      } else {
        // 0–2 → 두 번째 자리 대기
        setHours(digits);
      }
      return;
    }

    const two = digits.slice(-2);
    const val = Number(two);
    if (val <= 23) {
      const h = two.padStart(2, "0");
      setHours(h);
      commit(h, minutes);
      minutesRef.current?.focus();
      minutesRef.current?.select();
    } else {
      // 유효하지 않은 두 자리 → 마지막 한 자리로 재시작
      const lastD = Number(digits.slice(-1));
      if (lastD >= 3) {
        const h = "0" + lastD;
        setHours(h);
        commit(h, minutes);
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
      commit(hours, "");
      return;
    }

    if (digits.length === 1) {
      const d = Number(digits);
      if (d >= 6) {
        const m = "0" + d;
        setMinutes(m);
        commit(hours, m);
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
      commit(hours, m);
    } else {
      const lastD = Number(digits.slice(-1));
      if (lastD >= 6) {
        const m = "0" + lastD;
        setMinutes(m);
        commit(hours, m);
      } else {
        setMinutes(String(lastD));
      }
    }
  }

  function handleHoursKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab") return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = hours.length === 2 ? Number(hours) : 0;
      const h = String((current + 1) % 24).padStart(2, "0");
      setHours(h);
      commit(h, minutes);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = hours.length === 2 ? Number(hours) : 0;
      const h = String((current - 1 + 24) % 24).padStart(2, "0");
      setHours(h);
      commit(h, minutes);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      setHours("");
      commit("", minutes);
      return;
    }

    // 완성된 상태에서 새 숫자 입력 시 전체 선택 → 덮어쓰기
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
      commit(hours, m);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = minutes.length === 2 ? Number(minutes) : 0;
      const m = String((current - 1 + 60) % 60).padStart(2, "0");
      setMinutes(m);
      commit(hours, m);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      setMinutes("");
      commit(hours, "");
      return;
    }

    if (e.key >= "0" && e.key <= "9" && minutes.length === 2) {
      e.currentTarget.select();
    }
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
  );
}
