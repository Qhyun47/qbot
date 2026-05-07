"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AutoTypeOptions {
  charDelay?: number;
  lineDelay?: number;
  startDelay?: number;
}

interface AutoTypeResult {
  displayLines: string[];
  isDone: boolean;
  reset: () => void;
}

export function useAutoType(
  lines: string[],
  options: AutoTypeOptions = {}
): AutoTypeResult {
  const { charDelay = 40, lineDelay = 300, startDelay = 0 } = options;

  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  // 배열을 값 기반으로 비교 — 참조가 달라도 내용이 같으면 재실행하지 않음
  const linesKey = lines.join("\0");

  useEffect(() => {
    clearTimeouts();
    setDisplayLines([]);
    setIsDone(false);

    const currentLines = linesRef.current;
    if (currentLines.length === 0) return clearTimeouts;

    let totalDelay = startDelay;

    currentLines.forEach((line, lineIndex) => {
      const t0 = setTimeout(() => {
        setDisplayLines((prev) => {
          const next = [...prev];
          next[lineIndex] = "";
          return next;
        });
      }, totalDelay);
      timeoutsRef.current.push(t0);
      totalDelay += lineIndex === 0 ? 0 : lineDelay;

      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const delay = totalDelay + charIndex * charDelay;
        const char = line[charIndex];
        const t = setTimeout(() => {
          setDisplayLines((prev) => {
            const next = [...prev];
            next[lineIndex] = (next[lineIndex] ?? "") + char;
            return next;
          });
        }, delay);
        timeoutsRef.current.push(t);
      }

      totalDelay += line.length * charDelay;
    });

    const doneTimeout = setTimeout(() => setIsDone(true), totalDelay);
    timeoutsRef.current.push(doneTimeout);

    return clearTimeouts;
  }, [linesKey, charDelay, lineDelay, startDelay, clearTimeouts, runKey]);

  const reset = useCallback(() => {
    setRunKey((k) => k + 1);
  }, []);

  return { displayLines, isDone, reset };
}
