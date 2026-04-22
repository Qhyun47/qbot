import { Badge } from "@/components/ui/badge";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { XCircle } from "lucide-react";
import type { GuideItem } from "@/lib/admin/resource-reader";

interface GuideDetailProps {
  item: GuideItem;
}

export function GuideDetail({ item }: GuideDetailProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{item.displayName}</h2>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {item.key}
          </code>
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

      {/* 가이드라인 내용 */}
      {item.content ? (
        <MarkdownPreview content={item.content} />
      ) : (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          <span>
            <code className="text-xs">ai-docs/cc/{item.key}/guide.md</code>{" "}
            파일을 찾을 수 없습니다.
          </span>
        </div>
      )}
    </div>
  );
}
