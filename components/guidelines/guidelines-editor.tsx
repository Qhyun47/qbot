"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { FileUp, Loader2, Save, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { HtmlPreview } from "@/components/ui/html-preview";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  upsertGuideline,
  deleteGuideline,
  deleteGuidelinePdf,
} from "@/lib/guidelines/actions";
import { processGuideHtml } from "@/lib/utils/html-utils";
import type { Guideline } from "@/lib/supabase/types";

type InputMode = "text" | "markdown" | "html" | "pdf";

interface GuideListItem {
  guideKey: string;
  displayName: string;
}

interface GuidelinesEditorProps {
  guideList: GuideListItem[];
  initialGuidelines: Guideline[];
  systemGuides: Record<string, string>;
}

export function GuidelinesEditor({
  guideList,
  initialGuidelines,
  systemGuides,
}: GuidelinesEditorProps) {
  const [selectedGuideKey, setSelectedGuideKey] = useState(
    guideList[0]?.guideKey ?? ""
  );
  const [customGuidelines, setCustomGuidelines] =
    useState<Guideline[]>(initialGuidelines);
  const [, startTransition] = useTransition();
  const [isFileLoading, setIsFileLoading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const currentCustom = customGuidelines.find(
    (g) => g.guide_key === selectedGuideKey
  );

  const [customContent, setCustomContent] = useState(
    currentCustom?.content ?? ""
  );
  const [inputMode, setInputMode] = useState<InputMode>(
    (currentCustom?.source_type as InputMode) ?? "text"
  );
  const [savedPdfPath, setSavedPdfPath] = useState(
    currentCustom?.pdf_path ?? ""
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");

  function handleGuideKeyChange(guideKey: string) {
    setSelectedGuideKey(guideKey);
    const existing = customGuidelines.find((g) => g.guide_key === guideKey);
    setCustomContent(existing?.content ?? "");
    setInputMode((existing?.source_type as InputMode) ?? "text");
    setSavedPdfPath(existing?.pdf_path ?? "");
    setPdfFile(null);
    setPdfFileName("");
    setRawHtmlInput("");
    setEncodingHelpOpen(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        let pdfPath: string | null | undefined = undefined;
        let content = customContent;

        if (inputMode === "pdf") {
          if (pdfFile) {
            // 미저장 PDF → 업로드 처리
            setIsFileLoading(true);
            const formData = new FormData();
            formData.append("file", pdfFile);
            formData.append("guideKey", selectedGuideKey);
            if (savedPdfPath) formData.append("oldPdfPath", savedPdfPath);
            const res = await fetch("/api/guidelines/parse-pdf", {
              method: "POST",
              body: formData,
            });
            const json = await res.json();
            setIsFileLoading(false);
            if (!res.ok) {
              toast.error(json.error ?? "PDF 업로드에 실패했습니다.");
              return;
            }
            content = json.text as string;
            pdfPath = json.storagePath as string;
            setSavedPdfPath(pdfPath);
            setPdfFile(null);
          } else if (savedPdfPath) {
            // 이미 저장된 PDF — 경로만 유지
            pdfPath = savedPdfPath;
          } else {
            toast.error("저장할 PDF 파일이 없습니다.");
            return;
          }
        }

        const saved = await upsertGuideline(
          selectedGuideKey,
          content || " ",
          inputMode,
          pdfPath
        );
        setCustomContent(content);
        setCustomGuidelines((prev) => {
          const next = prev.filter((g) => g.guide_key !== selectedGuideKey);
          return [...next, saved].sort((a, b) =>
            a.guide_key.localeCompare(b.guide_key)
          );
        });
        toast.success("가이드라인이 저장되었습니다.");
      } catch {
        toast.error("저장에 실패했습니다.");
      } finally {
        setIsFileLoading(false);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        if (currentCustomRow) {
          await deleteGuideline(selectedGuideKey);
          setCustomGuidelines((prev) =>
            prev.filter((g) => g.guide_key !== selectedGuideKey)
          );
          toast.success("가이드라인이 삭제되었습니다.");
        }
        setCustomContent("");
        setSavedPdfPath("");
        setPdfFile(null);
        setPdfFileName("");
        setInputMode("text");
        setRawHtmlInput("");
      } catch {
        toast.error("삭제에 실패했습니다.");
      }
    });
  }

  async function handlePdfSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("PDF 파일은 5MB를 초과할 수 없습니다.");
      return;
    }
    setPdfFile(file);
    setPdfFileName(file.name);
  }

  async function handlePdfChange() {
    // 기존 저장된 PDF를 DB/Storage에서 제거 후 새 파일 선택
    if (savedPdfPath) {
      try {
        await deleteGuidelinePdf(selectedGuideKey);
        setSavedPdfPath("");
      } catch {
        toast.error("기존 PDF 삭제에 실패했습니다.");
        return;
      }
    }
    setPdfFile(null);
    setPdfFileName("");
    pdfInputRef.current?.click();
  }

  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [rawHtmlInput, setRawHtmlInput] = useState("");
  const [encodingHelpOpen, setEncodingHelpOpen] = useState(false);

  function handleHtmlProcess() {
    const processed = processGuideHtml(rawHtmlInput);
    setCustomContent(processed);
    setRawHtmlInput("");
    setEncodingHelpOpen(false);
    setHtmlDialogOpen(false);
  }

  const hasPdf = !!pdfFile || !!savedPdfPath;
  const hasHtml = inputMode === "html" && customContent.trim() !== "";
  const htmlPending = inputMode === "html" && rawHtmlInput.trim() !== "";
  const displayPdfName =
    pdfFileName || (savedPdfPath ? savedPdfPath.split("/").pop() : "");
  const systemContent = systemGuides[selectedGuideKey] ?? "";
  const isSaveDisabled =
    isFileLoading ||
    (inputMode !== "pdf" && !customContent.trim()) ||
    (inputMode === "pdf" && !hasPdf);
  const currentCustomRow = customGuidelines.find(
    (g) => g.guide_key === selectedGuideKey
  );

  return (
    <div className="space-y-6">
      {/* 가이드라인 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="guide-select" className="text-sm font-medium">
          가이드라인 선택
        </Label>
        <Select value={selectedGuideKey} onValueChange={handleGuideKeyChange}>
          <SelectTrigger id="guide-select" className="w-full max-w-sm">
            <SelectValue placeholder="가이드라인을 선택하세요" />
          </SelectTrigger>
          <SelectContent position="popper">
            {guideList.map((item) => (
              <SelectItem key={item.guideKey} value={item.guideKey}>
                {item.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 에디터 영역
          모바일: order로 [시스템 헤더 → 시스템 콘텐츠 → 커스텀 헤더 → 커스텀 콘텐츠] 순 렌더
          데스크탑: grid-cols-2로 좌(시스템)/우(커스텀) 2컬럼, 같은 행의 헤더 높이가 자동 동기화 */}
      <div className="flex flex-col gap-y-2 md:grid md:grid-cols-2 md:gap-x-4 md:gap-y-2">
        {/* 시스템 헤더 — mobile order 1 / desktop grid (1,1) */}
        <div className="order-1 flex items-center justify-between md:order-1">
          <p className="text-sm font-medium">시스템 기본 가이드라인</p>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            읽기 전용
          </span>
        </div>

        {/* 커스텀 헤더 — mobile order 3 / desktop grid (1,2) */}
        <div className="order-3 flex items-center justify-between md:order-2">
          <p className="text-sm font-medium">커스텀 가이드라인 편집</p>
          <ToggleGroup
            type="single"
            size="sm"
            value={inputMode}
            onValueChange={(v) => {
              if (v) setInputMode(v as InputMode);
            }}
            className="gap-0"
          >
            <ToggleGroupItem
              value="text"
              className="rounded-r-none px-3 text-xs"
            >
              Text
            </ToggleGroupItem>
            <ToggleGroupItem
              value="markdown"
              className="rounded-none border-x-0 px-3 text-xs"
            >
              Markdown
            </ToggleGroupItem>
            <ToggleGroupItem
              value="html"
              className="rounded-none border-x-0 px-3 text-xs"
            >
              HTML
            </ToggleGroupItem>
            <ToggleGroupItem
              value="pdf"
              className="rounded-l-none px-3 text-xs"
            >
              PDF
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* 시스템 콘텐츠 — mobile order 2 / desktop grid (2,1) */}
        <div className="order-2 h-72 overflow-y-auto rounded-lg border bg-muted/50 p-4 md:order-3">
          {systemContent ? (
            systemContent.trimStart().startsWith("<") ? (
              <HtmlPreview content={systemContent} />
            ) : (
              <MarkdownPreview content={systemContent} />
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              이 가이드라인에 대한 시스템 기본 내용이 없습니다.
            </p>
          )}
        </div>

        {/* 커스텀 콘텐츠 — mobile order 4 / desktop grid (2,2) */}
        <div className="order-4 flex flex-col gap-2 md:order-4">
          {inputMode === "pdf" ? (
            <div className="flex h-72 items-center justify-center rounded-lg border bg-muted/50">
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePdfSelect}
              />
              {hasPdf ? (
                <div className="flex flex-col items-center gap-3 px-4 text-center">
                  <p className="max-w-[240px] truncate text-sm font-medium">
                    {displayPdfName}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handlePdfChange}
                  >
                    <RefreshCw className="size-3.5" />
                    변경
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <FileUp className="size-3.5" />
                  PDF 추가
                </Button>
              )}
            </div>
          ) : inputMode === "html" ? (
            hasHtml ? (
              <div className="h-72 overflow-y-auto rounded-lg border bg-muted/50 p-4">
                <HtmlPreview content={customContent} />
              </div>
            ) : htmlPending ? (
              <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-lg border bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  HTML이 입력되었습니다.
                </p>
                <p className="text-xs text-muted-foreground">
                  아래 &apos;처리&apos; 버튼을 눌러 가이드라인을 적용하세요.
                </p>
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center rounded-lg border bg-muted/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setRawHtmlInput("");
                    setHtmlDialogOpen(true);
                  }}
                >
                  <FileUp className="size-3.5" />
                  HTML 추가
                </Button>
              </div>
            )
          ) : (
            <Textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder={
                inputMode === "markdown"
                  ? "Markdown 형식으로 커스텀 가이드라인을 작성하세요..."
                  : "커스텀 가이드라인을 작성하세요..."
              }
              className="h-72 resize-none font-mono text-sm"
            />
          )}

          <div className="flex gap-2">
            {htmlPending ? (
              <Button onClick={handleHtmlProcess} size="sm" className="gap-1.5">
                <RefreshCw className="size-3.5" />
                처리
              </Button>
            ) : (
              <>
                {hasHtml && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setCustomContent("");
                      setRawHtmlInput("");
                      setHtmlDialogOpen(true);
                    }}
                  >
                    <RefreshCw className="size-3.5" />
                    변경
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="gap-1.5"
                  disabled={isSaveDisabled}
                >
                  {isFileLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {isFileLoading ? "처리 중..." : "저장"}
                </Button>
              </>
            )}
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!currentCustomRow && !customContent.trim() && !hasPdf}
            >
              <Trash2 className="size-3.5" />
              삭제
            </Button>
          </div>
        </div>
      </div>

      {/* HTML 붙여넣기 다이얼로그
          sm:max-w-2xl로 기본값 sm:max-w-lg 오버라이드.
          bg-popover + 명시적 border/shadow로 다크모드에서도 오버레이와 구분되게 */}
      <Dialog open={htmlDialogOpen} onOpenChange={setHtmlDialogOpen}>
        <DialogContent className="border bg-popover shadow-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>가이드라인 HTML 붙여넣기</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Textarea
              value={rawHtmlInput}
              onChange={(e) => setRawHtmlInput(e.target.value)}
              placeholder="HWP에서 내보낸 HTML 전체를 붙여넣으세요..."
              className="h-72 resize-none font-mono text-xs"
            />
            <div>
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setEncodingHelpOpen((v) => !v)}
              >
                한글이 깨져 보이나요?
              </button>
              {encodingHelpOpen && (
                <p className="mt-1 text-xs text-muted-foreground">
                  파일을 메모장(또는 VS Code)으로 열고 UTF-8로 다시 저장한 후
                  내용을 붙여넣어 주세요.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHtmlDialogOpen(false);
                setRawHtmlInput("");
                setEncodingHelpOpen(false);
              }}
            >
              취소
            </Button>
            <Button onClick={handleHtmlProcess} disabled={!rawHtmlInput.trim()}>
              처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 커스텀 현황 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">커스텀 설정 현황</p>
        <div className="rounded-lg border bg-card p-4">
          {customGuidelines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              저장된 커스텀 가이드라인이 없습니다.
            </p>
          ) : (
            <ul className="space-y-1">
              {customGuidelines.map((g) => (
                <li
                  key={g.guide_key}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="font-medium">{g.guide_key}</span>
                  <span className="text-muted-foreground">—</span>
                  {g.source_type === "pdf" ? (
                    <span className="text-muted-foreground">
                      PDF ({g.pdf_path?.split("/").pop() ?? "파일"})
                    </span>
                  ) : (
                    <span className="truncate text-muted-foreground">
                      {g.content.slice(0, 60)}
                      {g.content.length > 60 ? "..." : ""}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
