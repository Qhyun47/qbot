"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileUp, Loader2, Save, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
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
  getGuidelinePdfSignedUrl,
} from "@/lib/guidelines/actions";
import {
  processGuideHtml,
  extractImgFilenames,
  resizeImageToBase64,
  replaceImgSrcs,
} from "@/lib/utils/html-utils";
import type { Guideline } from "@/lib/supabase/types";

type InputMode = "text" | "markdown" | "html" | "pdf";

interface GuideListItem {
  guideKey: string;
  displayName: string;
  dividerAfter?: boolean;
}

interface GuidelinesEditorProps {
  guideList: GuideListItem[];
  initialGuidelines: Guideline[];
  systemGuides: Record<string, string>;
}

function extractGuidelineTitle(
  content: string,
  sourceType: string,
  pdfPath: string | null
): string {
  switch (sourceType) {
    case "text":
      return content.split("\n").find((l) => l.trim()) ?? "";
    case "markdown":
      return (
        content
          .split("\n")
          .find((l) => l.trim())
          ?.replace(/^#+\s*/, "")
          .replace(/[*_`~>]/g, "")
          .trim() ?? ""
      );
    case "html":
      return (
        content
          .replace(/<[^>]+>/g, " ")
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.length > 0) ?? ""
      );
    case "pdf":
      return (
        pdfPath
          ?.split("/")
          .pop()
          ?.replace(/\.pdf$/i, "") ?? "PDF"
      );
    default:
      return content.slice(0, 50);
  }
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
  const [pdfDisplayUrl, setPdfDisplayUrl] = useState("");

  function handleGuideKeyChange(guideKey: string) {
    setSelectedGuideKey(guideKey);
    const existing = customGuidelines.find((g) => g.guide_key === guideKey);
    setCustomContent(existing?.content ?? "");
    setInputMode((existing?.source_type as InputMode) ?? "text");
    setSavedPdfPath(existing?.pdf_path ?? "");
    setPdfFile(null);
    setPdfFileName("");
    setPdfDisplayUrl("");
    setRawHtmlInput("");
    setImageFiles([]);
    setEncodingHelpOpen(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        let pdfPath: string | null | undefined = undefined;
        const content = customContent;

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
        setPdfDisplayUrl("");
        setInputMode("text");
        setRawHtmlInput("");
        setImageFiles([]);
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

  useEffect(() => {
    if (!savedPdfPath) {
      setPdfDisplayUrl("");
      return;
    }
    getGuidelinePdfSignedUrl(selectedGuideKey)
      .then(setPdfDisplayUrl)
      .catch(() => setPdfDisplayUrl(""));
  }, [savedPdfPath, selectedGuideKey]);

  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [rawHtmlInput, setRawHtmlInput] = useState("");
  const [encodingHelpOpen, setEncodingHelpOpen] = useState(false);
  const [detectedImgFilenames, setDetectedImgFilenames] = useState<string[]>(
    []
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isHtmlProcessing, setIsHtmlProcessing] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!rawHtmlInput.trim()) {
      setDetectedImgFilenames([]);
      return;
    }
    setDetectedImgFilenames(extractImgFilenames(rawHtmlInput));
  }, [rawHtmlInput]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length > 3) {
      toast.error("이미지는 최대 3장까지 첨부할 수 있습니다.");
      return;
    }
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name}: 이미지 파일은 2MB를 초과할 수 없습니다.`);
        return;
      }
    }
    setImageFiles(files);
  }

  async function handleHtmlProcess() {
    setIsHtmlProcessing(true);
    try {
      let html = rawHtmlInput;
      if (imageFiles.length > 0) {
        const imageMap = new Map<string, string>();
        for (const file of imageFiles) {
          const base64 = await resizeImageToBase64(file, 1200);
          imageMap.set(file.name, base64);
        }
        html = replaceImgSrcs(html, imageMap);
        const remaining = extractImgFilenames(html);
        if (remaining.length > 0) {
          toast.warning(`첨부되지 않은 이미지: ${remaining.join(", ")}`);
        }
      }
      const processed = processGuideHtml(html);
      setCustomContent(processed);
      setRawHtmlInput("");
      setImageFiles([]);
      setEncodingHelpOpen(false);
      setHtmlDialogOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "이미지 처리에 실패했습니다."
      );
    } finally {
      setIsHtmlProcessing(false);
    }
  }

  const hasPdf = !!pdfFile || !!savedPdfPath;
  const hasHtml = inputMode === "html" && customContent.trim() !== "";
  const htmlPending = inputMode === "html" && rawHtmlInput.trim() !== "";
  const _displayPdfName =
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
          <SelectContent
            position="popper"
            className="max-h-[min(360px,var(--radix-select-content-available-height))] overflow-y-auto"
          >
            {guideList.map((item) => (
              <Fragment key={item.guideKey}>
                <SelectItem value={item.guideKey}>
                  {item.displayName}
                </SelectItem>
                {item.dividerAfter && <SelectSeparator />}
              </Fragment>
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
            <div className="flex flex-col gap-2">
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePdfSelect}
              />
              {pdfDisplayUrl ? (
                <iframe
                  src={pdfDisplayUrl}
                  className="h-72 w-full rounded-lg border"
                  title="PDF 가이드라인"
                />
              ) : pdfFile ? (
                <div className="flex h-72 items-center justify-center rounded-lg border bg-muted/50">
                  <p className="max-w-[240px] truncate text-sm text-muted-foreground">
                    {pdfFileName}
                  </p>
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-lg border bg-muted/50">
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
                </div>
              )}
              {hasPdf && (
                <div className="flex justify-end">
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
                    setImageFiles([]);
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
                  ? "Markdown 형식으로 커스텀 가이드라인을 작성하세요."
                  : "커스텀 가이드라인을 작성하세요.\n(hwp 파일은 HTML로 변환하여 첨부하면 서식과 표를 최대한 보존할 수 있습니다.)"
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
                      setImageFiles([]);
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
        <DialogContent className="flex max-h-[90vh] flex-col border bg-popover shadow-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>가이드라인 HTML 붙여넣기</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
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
                HWP 파일 변환 방법 안내
              </button>
              {encodingHelpOpen && (
                <div className="mt-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <p className="mb-1.5 font-semibold text-foreground">
                    HWP → HTML 변환 방법
                  </p>
                  <ol className="mb-4 list-inside list-decimal space-y-1">
                    <li>한글 프로그램에서 해당 문서 열기</li>
                    <li>
                      상단 메뉴 <strong>파일</strong> →{" "}
                      <strong>다른 이름으로 저장</strong> 클릭
                    </li>
                    <li>
                      저장 창에서 파일 형식을{" "}
                      <strong>인터넷 문서 (*.htm)</strong> 으로 변경 후 저장
                    </li>
                    <li>
                      (문자 코드 선택 → <strong>유니코드(UTF-8)</strong> 지정 후
                      확인)
                    </li>
                    <li>
                      저장된 <code>.htm</code> 파일을 <strong>메모장</strong>
                      으로 열기
                    </li>
                    <li>
                      <strong>Ctrl+A → Ctrl+C</strong> 로 전체 복사 후 이 창에{" "}
                      <strong>Ctrl+V</strong> 로 붙여넣기
                    </li>
                  </ol>

                  <p className="mb-1.5 font-semibold text-foreground">
                    한글이 깨져 보이나요?{" "}
                    <span className="font-normal text-muted-foreground">
                      (깨질 때만 수행)
                    </span>
                  </p>
                  <p className="mb-2">
                    HWP에서 내보낸 HTML 파일은 한글 인코딩(EUC-KR)으로 저장되는
                    경우가 많습니다. 아래 방법으로 UTF-8로 변환 후 다시
                    붙여넣으세요.
                  </p>

                  <p className="mb-1.5 font-semibold text-foreground">
                    메모장으로 해결하기 (Windows)
                  </p>
                  <ol className="mb-3 list-inside list-decimal space-y-1">
                    <li>
                      HTML 파일을 <strong>우클릭</strong> → &ldquo;연결
                      프로그램&rdquo; → <strong>메모장</strong> 선택
                    </li>
                    <li>
                      상단 메뉴 <strong>파일</strong> →{" "}
                      <strong>다른 이름으로 저장</strong> 클릭
                    </li>
                    <li>
                      저장 창 하단 &ldquo;인코딩&rdquo; 항목을{" "}
                      <strong>UTF-8</strong> 로 변경
                    </li>
                    <li>파일 이름 그대로 저장 (덮어쓰기)</li>
                    <li>
                      저장된 파일을 다시 메모장으로 열고{" "}
                      <strong>Ctrl+A → Ctrl+C</strong> 로 전체 복사
                    </li>
                    <li>
                      이 창에 <strong>Ctrl+V</strong> 로 붙여넣기
                    </li>
                  </ol>

                  <p className="mb-1.5 font-semibold text-foreground">
                    VS Code로 해결하기{" "}
                    <span className="font-normal text-muted-foreground">
                      (메모장에서 해결이 안 될 때)
                    </span>
                  </p>
                  <ol className="list-inside list-decimal space-y-1">
                    <li>VS Code에서 HTML 파일 열기</li>
                    <li>오른쪽 하단 상태바의 인코딩 이름(예: EUC-KR) 클릭</li>
                    <li>
                      &ldquo;다른 인코딩으로 다시 열기&rdquo; →{" "}
                      <strong>Korean (EUC-KR)</strong> 선택
                    </li>
                    <li>한글이 정상으로 보이면, 다시 하단 인코딩 이름 클릭</li>
                    <li>
                      &ldquo;인코딩을 지정하여 저장&rdquo; →{" "}
                      <strong>UTF-8</strong> 선택
                    </li>
                    <li>
                      <strong>Ctrl+A → Ctrl+C</strong> 로 복사 후 이 창에
                      붙여넣기
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
          {detectedImgFilenames.length > 0 && (
            <div className="space-y-2 rounded-md border bg-amber-50 p-3 dark:bg-amber-950/20">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                이미지 {detectedImgFilenames.length}장 감지됨
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                HTML에 로컬 이미지 파일이 포함되어 있습니다. 아래 파일명과
                동일한 이미지를 선택하면 자동으로 삽입됩니다.
              </p>
              <ul className="space-y-0.5 text-xs">
                {detectedImgFilenames.map((name) => {
                  const matched = imageFiles.some((f) => f.name === name);
                  return (
                    <li
                      key={name}
                      className={
                        matched
                          ? "text-green-700 dark:text-green-400"
                          : "text-amber-800 dark:text-amber-300"
                      }
                    >
                      {matched ? "✓ " : "• "}
                      {name}
                    </li>
                  );
                })}
              </ul>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => imgInputRef.current?.click()}
              >
                <FileUp className="size-3.5" />
                {imageFiles.length > 0
                  ? `${imageFiles.length}장 선택됨 — 변경`
                  : "이미지 파일 선택"}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHtmlDialogOpen(false);
                setRawHtmlInput("");
                setImageFiles([]);
                setEncodingHelpOpen(false);
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleHtmlProcess}
              disabled={!rawHtmlInput.trim() || isHtmlProcessing}
            >
              {isHtmlProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  처리 중...
                </>
              ) : (
                "처리"
              )}
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
                  <span className="font-medium">
                    {extractGuidelineTitle(
                      g.content,
                      g.source_type,
                      g.pdf_path
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(g.created_at), "yyyy.MM.dd HH:mm")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
