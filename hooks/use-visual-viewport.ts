"use client";

import { useEffect, type RefObject } from "react";

/**
 * 키보드가 올라올 때 컨테이너 높이를 시각적 뷰포트에 맞게 직접 DOM에 적용.
 *
 * - visualViewport.resize / window.resize 이벤트 수신 (보조)
 * - focusin / focusout 폴링 (주요): 이벤트가 발생하지 않는 브라우저(Samsung Internet 등) 대응
 * - 높이: Math.min(window.innerHeight, vv.height) → 구형/신형 Android 모두 커버
 */
export function useVisualViewport(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const vv = window.visualViewport;

    const getHeight = () => {
      const winH = window.innerHeight;
      const vvH = vv ? vv.height : winH;
      return Math.min(winH, vvH);
    };

    const update = () => {
      el.style.height = `${getHeight()}px`;
    };

    // 이벤트 기반 (Android Chrome 108+, 데스크탑)
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    window.addEventListener("resize", update);

    // 폴링 기반: focusin/focusout 시 800ms 동안 매 프레임 체크
    // Samsung Internet 등 resize 이벤트가 발생하지 않는 브라우저 대응
    let rafId: number | null = null;
    const poll = (durationMs: number) => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      const deadline = Date.now() + durationMs;
      const tick = () => {
        update();
        if (Date.now() < deadline) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    const onFocusIn = () => poll(800);
    const onFocusOut = () => poll(800);

    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);

    update();

    return () => {
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
      window.removeEventListener("resize", update);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [ref]);
}
