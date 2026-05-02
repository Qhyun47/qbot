"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface CompactModeContextValue {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
}

const CompactModeContext = createContext<CompactModeContextValue>({
  isCompact: false,
  setIsCompact: () => {},
});

export function CompactModeProvider({ children }: { children: ReactNode }) {
  const [isCompact, setIsCompact] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/dashboard") {
      setIsCompact(false);
    }
  }, [pathname]);

  return (
    <CompactModeContext.Provider value={{ isCompact, setIsCompact }}>
      {children}
    </CompactModeContext.Provider>
  );
}

export function useCompactMode() {
  return useContext(CompactModeContext);
}
