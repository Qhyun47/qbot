"use client";

import { useEffect, useRef, useState } from "react";

const TIMEOUT_MS = 30000;

export function useScreenGuard() {
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);
  const lastMoveRef = useRef(0);
  const startTimerRef = useRef<(() => void) | null>(null);

  // isActive 변경 시 ref 동기화 — 이벤트 핸들러 내부 stale closure 방지
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    // PC 전용: 마우스 포인터가 있는 기기(pointer: fine)에서만 동작
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const startTimer = () => {
      clearTimer();
      timerRef.current = setTimeout(() => setIsActive(true), TIMEOUT_MS);
    };

    // 외부 dismiss에서도 startTimer를 호출할 수 있도록 ref에 저장
    startTimerRef.current = startTimer;

    const dismissInner = () => {
      setIsActive(false);
      isActiveRef.current = false;
      startTimer();
    };

    const handleActivity = () => {
      if (isActiveRef.current) {
        dismissInner();
        return;
      }
      startTimer();
    };

    const handleMouseMove = () => {
      if (isActiveRef.current) return;
      const now = Date.now();
      if (now - lastMoveRef.current < 500) return;
      lastMoveRef.current = now;
      startTimer();
    };

    // 타이머 중단: 다른 창/탭/앱으로 전환 시
    const handleBlur = () => clearTimer();

    // 타이머 재시작: qbot으로 포커스 복귀 시
    const handleFocus = () => {
      if (!document.hidden) startTimer();
    };

    // 타이머 중단/재시작: 탭 전환 또는 창 최소화
    const handleVisibility = () => {
      if (document.hidden) clearTimer();
      else startTimer();
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("mousedown", handleActivity);
    document.addEventListener("keydown", handleActivity);
    document.addEventListener("scroll", handleActivity, true);
    document.addEventListener("mousemove", handleMouseMove);

    startTimer();

    return () => {
      clearTimer();
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("mousedown", handleActivity);
      document.removeEventListener("keydown", handleActivity);
      document.removeEventListener("scroll", handleActivity, true);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // 오버레이 컴포넌트에서 호출하는 해제 함수
  const dismiss = () => {
    setIsActive(false);
    isActiveRef.current = false;
    startTimerRef.current?.();
  };

  return { isActive, dismiss };
}
