"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getCaseDetail } from "@/lib/admin/ai-usage-queries";
import type { CaseDetail } from "@/lib/admin/ai-usage-queries";

interface Props {
  caseId: string;
}

function Section({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <pre className="whitespace-pre-wrap rounded bg-muted px-3 py-2 text-xs leading-relaxed">
        {value}
      </pre>
    </div>
  );
}

export function CaseDetailPanel({ caseId }: Props) {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCaseDetail(caseId).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 pl-4 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        불러오는 중...
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="space-y-4 border-t bg-muted/30 px-6 py-4">
      {/* 문진 정보 */}
      {detail.inputs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold">문진 정보</p>
          <div className="space-y-1">
            {detail.inputs.map((input) => (
              <div key={input.id} className="flex gap-2 text-xs">
                {input.time_tag && (
                  <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {input.time_tag}
                  </span>
                )}
                <span className="text-foreground">{input.raw_text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 차팅 결과 */}
      {detail.result && (
        <div>
          <p className="mb-2 text-xs font-semibold">
            AI 차팅 결과
            <span className="ml-2 font-normal text-muted-foreground">
              {new Date(detail.result.generated_at).toLocaleString("ko-KR")} ·{" "}
              {detail.result.model_version}
            </span>
          </p>
          {detail.result.error_message && (
            <p className="mb-2 text-xs text-destructive">
              ⚠️ {detail.result.error_message}
            </p>
          )}
          <div className="space-y-3">
            <Section
              label="P.I. (현병력)"
              value={detail.result.pi_edited || detail.result.pi_draft || null}
            />
            <Section
              label="상용구"
              value={
                detail.result.template_edited ||
                detail.result.template_draft ||
                null
              }
            />
            <Section
              label="P/E (신체검진)"
              value={detail.result.pe_edited || detail.result.pe_draft || null}
            />
            <Section
              label="History"
              value={
                detail.result.history_edited ||
                detail.result.history_draft ||
                null
              }
            />
          </div>
        </div>
      )}

      {detail.inputs.length === 0 && !detail.result && (
        <p className="text-xs text-muted-foreground">
          등록된 문진 정보 또는 AI 차팅 결과가 없습니다.
        </p>
      )}
    </div>
  );
}
