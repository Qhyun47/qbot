import { cn } from "@/lib/utils";

interface HtmlPreviewProps {
  content: string;
  className?: string;
  zoom?: number;
}

export function HtmlPreview({ content, className, zoom }: HtmlPreviewProps) {
  return (
    <div
      className={cn("guideline-html", className)}
      style={zoom !== undefined ? { zoom } : undefined}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
