"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CaseStatus } from "@/lib/supabase/types";

interface GenerationPollerProps {
  caseId: string;
  initialStatus: CaseStatus;
}

const MAX_FAILURES = 10;

export function GenerationPoller({
  caseId,
  initialStatus,
}: GenerationPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (initialStatus === "completed" || initialStatus === "failed") return;

    let failCount = 0;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}/status`);
        if (!res.ok) {
          failCount++;
          if (failCount >= MAX_FAILURES) clearInterval(interval);
          return;
        }
        failCount = 0;
        const data = await res.json();
        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        failCount++;
        if (failCount >= MAX_FAILURES) clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [caseId, initialStatus, router]);

  return null;
}
