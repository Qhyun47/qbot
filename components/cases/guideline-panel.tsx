import { BookOpen } from "lucide-react";

interface GuidelinePanelProps {
  content: string | null;
  cc: string | null;
}

export function GuidelinePanel({ content, cc }: GuidelinePanelProps) {
  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="shrink-0 border-b px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen className="size-3" />
          문진 가이드라인
          {cc && <span className="font-normal text-foreground">— {cc}</span>}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!cc ? (
          <p className="text-sm text-muted-foreground">
            C.C.를 입력하면 해당 증상에 맞는 문진 가이드라인이 표시됩니다.
          </p>
        ) : !content ? (
          <p className="text-sm text-muted-foreground">
            가이드라인을 불러오는 중...
          </p>
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
