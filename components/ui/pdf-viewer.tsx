"use client";

import { useCallback, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const SCALE_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];

interface PdfViewerProps {
  url: string;
  /** true이면 자체 스크롤 없이 부모 스크롤 컨테이너 안에서 콘텐츠가 자연스럽게 흐름 */
  embedded?: boolean;
}

export function PdfViewer({ url, embedded = false }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scaleIdx, setScaleIdx] = useState<number>(2); // 1.0 = fit-width
  const [containerWidth, setContainerWidth] = useState<number>(600);

  const observerRef = useRef<ResizeObserver | null>(null);

  const containerCallback = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(node);
    observerRef.current = ro;
    setContainerWidth(node.clientWidth);
  }, []);

  const scale = SCALE_STEPS[scaleIdx];
  const pageWidth = Math.floor(containerWidth * scale);

  return (
    <div className={embedded ? "flex flex-col" : "flex h-full flex-col"}>
      {/* 커스텀 컨트롤 바 */}
      <div className="flex shrink-0 items-center justify-end gap-1 border-b bg-muted/20 px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={scaleIdx === 0}
          onClick={() => setScaleIdx((i) => Math.max(0, i - 1))}
          aria-label="축소"
        >
          <ZoomOut className="size-3.5" />
        </Button>
        <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={scaleIdx === SCALE_STEPS.length - 1}
          onClick={() =>
            setScaleIdx((i) => Math.min(SCALE_STEPS.length - 1, i + 1))
          }
          aria-label="확대"
        >
          <ZoomIn className="size-3.5" />
        </Button>
      </div>

      {/* PDF 콘텐츠 영역 (embedded 모드에서는 부모가 스크롤을 담당) */}
      <div
        ref={containerCallback}
        className={
          embedded ? "bg-muted/10" : "flex-1 overflow-auto bg-muted/10"
        }
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <p className="p-4 text-sm text-muted-foreground">
              PDF 불러오는 중...
            </p>
          }
          error={
            <p className="p-4 text-sm text-destructive">
              PDF를 불러올 수 없습니다.
            </p>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={pageWidth || undefined}
              className="mb-1"
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
