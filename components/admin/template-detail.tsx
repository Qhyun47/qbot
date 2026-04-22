import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import type { TemplateItem } from "@/lib/admin/resource-reader";

interface TemplateDetailProps {
  item: TemplateItem;
}

function OutputPreview({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  const preview = lines.slice(0, 7).join("\n");
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium">{label}</p>
      <pre className="overflow-x-auto rounded border bg-muted/50 p-2 text-xs leading-relaxed">
        {preview}
        {lines.length > 7 && "\n..."}
      </pre>
    </div>
  );
}

export function TemplateDetail({ item }: TemplateDetailProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{item.displayName}</h2>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {item.key}
          </code>
          {item.exists ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
          ) : (
            <XCircle className="size-4 text-destructive" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">연결된 C.C.</span>
          {item.linkedCcs.length === 0 ? (
            <span className="text-xs text-muted-foreground">없음</span>
          ) : (
            item.linkedCcs.map((cc) => (
              <Badge key={cc} variant="secondary" className="text-xs">
                {cc}
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="border-t" />

      {/* 상용구 출력 예시 */}
      {item.exists ? (
        <Card className="overflow-hidden">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm">
              <code className="font-mono text-xs text-muted-foreground">
                ai-docs/cc/{item.key}/template.json
              </code>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-4 pb-4 sm:grid-cols-3">
            <OutputPreview
              label={`P.I 상용구 (fields)`}
              text={item.mainOutputExample}
            />
            <OutputPreview
              label={`History (${item.historyFieldCount}개 항목)`}
              text={item.historyOutputExample}
            />
            <OutputPreview
              label={`P/E (${item.peFieldCount}개 항목)`}
              text={item.peOutputExample}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          <span>
            <code className="text-xs">ai-docs/cc/{item.key}/template.json</code>{" "}
            파일을 찾을 수 없습니다.
          </span>
        </div>
      )}
    </div>
  );
}
