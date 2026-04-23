import { cn } from "@/lib/utils";

interface HtmlPreviewProps {
  content: string;
  className?: string;
}

export function HtmlPreview({ content, className }: HtmlPreviewProps) {
  return (
    <div
      className={cn("guideline-html", className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
