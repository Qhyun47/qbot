"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const STORAGE_KEY = "dashboard-compact-mode";

interface CompactModeContextValue {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
}

const CompactModeContext = createContext<CompactModeContextValue>({
  isCompact: false,
  setIsCompact: () => {},
});

export function CompactModeProvider({ children }: { children: ReactNode }) {
  const [isCompact, setIsCompactState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setIsCompactState(true);
  }, []);

  function setIsCompact(value: boolean) {
    setIsCompactState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }

  return (
    <CompactModeContext.Provider value={{ isCompact, setIsCompact }}>
      {children}
    </CompactModeContext.Provider>
  );
}

export function useCompactMode() {
  return useContext(CompactModeContext);
}
