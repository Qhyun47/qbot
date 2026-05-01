"use client";

import { useEffect, type RefObject } from "react";

/**
 * 키보드가 올라올 때 시각적 뷰포트에 맞춰 요소 크기/위치를 직접 DOM에 적용.
 * React 재렌더링을 거치지 않으므로 즉시 반영됩니다.
 *
 * - height: visualViewport.height (키보드 영역 제외)
 * - transform: translateY(visualViewport.offsetTop) — iOS fixed 요소 위치 보정
 */
export function useVisualViewport(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const vv = window.visualViewport;

    const update = () => {
      const height = vv ? vv.height : window.innerHeight;
      const offsetTop = vv ? vv.offsetTop : 0;
      el.style.height = `${height}px`;
      el.style.transform = `translateY(${offsetTop}px)`;
    };

    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    // window.resize는 일부 Android에서 visualViewport 대신 발생
    window.addEventListener("resize", update);

    update();

    return () => {
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
      window.removeEventListener("resize", update);
    };
  }, [ref]);
}
