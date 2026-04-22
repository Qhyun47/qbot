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
import {
  upsertGuideline,
  deleteGuideline,
  deleteGuidelinePdf,
} from "@/lib/guidelines/actions";
import type { Guideline } from "@/lib/supabase/types";

type InputMode = "text" | "markdown" | "pdf";

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
        await deleteGuideline(selectedGuideKey);
        setCustomGuidelines((prev) =>
          prev.filter((g) => g.guide_key !== selectedGuideKey)
        );
        setCustomContent("");
        setSavedPdfPath("");
        setPdfFile(null);
        setPdfFileName("");
        setInputMode("text");
        toast.success("가이드라인이 삭제되었습니다.");
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

  const hasPdf = !!pdfFile || !!savedPdfPath;
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

      {/* 에디터 영역: 헤더 행과 콘텐츠 행을 공유 그리드로 정렬 */}
      <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
        {/* 헤더 행 — 같은 그리드 행에 배치되어 높이 자동 동기화 */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">시스템 기본 가이드라인</p>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            읽기 전용
          </span>
        </div>
        <div className="flex items-center justify-between">
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
              value="pdf"
              className="rounded-l-none px-3 text-xs"
            >
              PDF
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* 콘텐츠 행 — 시스템 기본 박스 */}
        <div className="h-72 overflow-y-auto rounded-lg border bg-muted/50 p-4">
          {systemContent ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
              {systemContent}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              이 가이드라인에 대한 시스템 기본 내용이 없습니다.
            </p>
          )}
        </div>

        {/* 콘텐츠 행 — 커스텀 편집 박스 + 버튼 */}
        <div className="flex flex-col gap-2">
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
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!currentCustomRow}
            >
              <Trash2 className="size-3.5" />
              삭제
            </Button>
          </div>
        </div>
      </div>

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
