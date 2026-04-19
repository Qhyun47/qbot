interface GuidelinePanelProps {
  content: string | null;
  cc: string | null;
}

export function GuidelinePanel({ content, cc }: GuidelinePanelProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      {!cc ? (
        <p className="text-sm text-muted-foreground">
          C.C.를 입력하면 문진 가이드라인이 표시됩니다.
        </p>
      ) : !content ? (
        <p className="text-sm text-muted-foreground">
          가이드라인을 불러오는 중입니다...
        </p>
      ) : (
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {content}
        </pre>
      )}
    </div>
  );
}
