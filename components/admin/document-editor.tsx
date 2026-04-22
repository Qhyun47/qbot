"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ClipboardCopy,
  CheckCircle2,
  History,
  Save,
  RotateCcw,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDocument,
  saveDocument,
  markSynced,
  getDocumentVersions,
  restoreVersion,
} from "@/lib/admin/document-actions";
import type {
  DocumentFull,
  DocumentVersionItem,
} from "@/lib/admin/document-actions";

interface DocumentEditorProps {
  docPath: string;
  /** 파일 트리의 메타 정보 업데이트 콜백 (저장/동기화 후 트리 갱신용) */
  onMetaChange?: () => void;
}

/**
 * updated_at이 synced_at보다 이후이거나 synced_at이 null이면 미동기화 상태입니다.
 */
function isUnsynced(doc: DocumentFull): boolean {
  if (!doc.synced_at) return true;
  return new Date(doc.updated_at) > new Date(doc.synced_at);
}

/**
 * JSON 문자열의 유효성을 검사합니다.
 */
function validateJson(text: string): string | null {
  try {
    JSON.parse(text);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "유효하지 않은 JSON입니다.";
  }
}

/**
 * 날짜를 읽기 쉬운 형식으로 포맷합니다.
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 버전 히스토리 패널 컴포넌트
function VersionHistoryPanel({
  docPath,
  onRestore,
  onClose,
}: {
  docPath: string;
  onRestore: () => void;
  onClose: () => void;
}) {
  const [versions, setVersions] = useState<DocumentVersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    getDocumentVersions(docPath)
      .then(setVersions)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [docPath]);

  async function handleRestore(versionId: string) {
    setRestoring(versionId);
    try {
      await restoreVersion(docPath, versionId);
      toast.success("버전이 복원되었습니다.");
      onRestore();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "복원에 실패했습니다.");
    } finally {
      setRestoring(null);
    }
  }

  const previewVersion = versions.find((v) => v.id === previewId);

  return (
    <div className="flex h-full flex-col gap-3">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          버전 히스토리가 없습니다.
        </p>
      ) : (
        <div className="space-y-1">
          {versions.map((v) => (
            <div
              key={v.id}
              className={`cursor-pointer rounded-md border p-2.5 text-xs transition-colors ${
                previewId === v.id
                  ? "border-primary bg-accent"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => setPreviewId(previewId === v.id ? null : v.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">v{v.version}</span>
                <span className="text-muted-foreground">
                  {formatDate(v.created_at)}
                </span>
              </div>
              {v.change_summary && (
                <p className="mt-0.5 text-muted-foreground">
                  {v.change_summary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 선택된 버전 미리보기 */}
      {previewVersion && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              v{previewVersion.version} 미리보기
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={restoring === previewVersion.id}
              onClick={() => handleRestore(previewVersion.id)}
            >
              <RotateCcw className="mr-1.5 size-3" />
              {restoring === previewVersion.id
                ? "복원 중..."
                : "이 버전으로 복원"}
            </Button>
          </div>
          <textarea
            readOnly
            value={previewVersion.content}
            className="h-48 w-full resize-none rounded-md border bg-muted p-2 font-mono text-xs"
          />
        </>
      )}
    </div>
  );
}

/**
 * 문서 에디터 컴포넌트.
 * 선택된 doc_path의 내용을 불러와 편집하고 저장합니다.
 */
export function DocumentEditor({ docPath, onMetaChange }: DocumentEditorProps) {
  const [doc, setDoc] = useState<DocumentFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");

  // 문서 로드
  const loadDoc = useCallback(async () => {
    setLoading(true);
    setIsDirty(false);
    setJsonError(null);
    try {
      const data = await getDocument(docPath);
      if (data) {
        setDoc(data);
        setContent(data.content);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "문서를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [docPath]);

  useEffect(() => {
    loadDoc();
  }, [loadDoc]);

  // 콘텐츠 변경 핸들러
  function handleContentChange(value: string) {
    setContent(value);
    setIsDirty(value !== doc?.content);

    // JSON 파일이면 즉시 유효성 검사
    if (doc?.doc_type === "json") {
      setJsonError(validateJson(value));
    }
  }

  // 저장 핸들러
  async function handleSave() {
    if (!doc || !isDirty) return;

    // JSON 최종 유효성 검사
    if (doc.doc_type === "json") {
      const err = validateJson(content);
      if (err) {
        toast.error(`JSON 오류: ${err}`);
        return;
      }
    }

    setSaving(true);
    try {
      await saveDocument(docPath, content, changeSummary || undefined);
      toast.success("저장되었습니다.");
      setChangeSummary("");
      await loadDoc();
      onMetaChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // 동기화 완료 표시 핸들러
  async function handleMarkSynced() {
    setSyncing(true);
    try {
      await markSynced(docPath);
      toast.success("동기화 완료로 표시되었습니다.");
      await loadDoc();
      onMetaChange?.();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "동기화 표시에 실패했습니다."
      );
    } finally {
      setSyncing(false);
    }
  }

  // 클립보드 복사 핸들러
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("클립보드에 복사되었습니다.");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          문서를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const unsynced = isUnsynced(doc);
  const isReadOnly = !doc.is_editable;
  const fileName = docPath.split("/").pop() ?? docPath;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 헤더 영역 */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium">{fileName}</span>
          <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
            {doc.doc_type}
          </Badge>
          {isReadOnly && (
            <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
              <Lock className="size-2.5" />
              읽기 전용
            </Badge>
          )}
          {unsynced && (
            <Badge
              variant="outline"
              className="shrink-0 border-amber-300 bg-amber-50 text-[10px] text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            >
              ⚠ 미동기화
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          마지막 수정: {formatDate(doc.updated_at)}
        </span>
      </div>

      {/* 버튼 영역 */}
      <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-2">
        {/* 변경 요약 입력 */}
        {!isReadOnly && (
          <input
            type="text"
            placeholder="변경 요약 (선택)"
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            className="h-7 flex-1 rounded-md border bg-background px-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            style={{ minWidth: "140px", maxWidth: "260px" }}
          />
        )}

        <Button
          size="sm"
          variant="default"
          className="h-7 text-xs"
          disabled={!isDirty || saving || isReadOnly || jsonError !== null}
          onClick={handleSave}
        >
          <Save className="mr-1.5 size-3" />
          {saving ? "저장 중..." : "저장"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setHistoryOpen(true)}
        >
          <History className="mr-1.5 size-3" />
          이력
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={handleCopy}
        >
          <ClipboardCopy className="mr-1.5 size-3" />
          복사
        </Button>

        {unsynced && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-green-600 hover:text-green-700"
            disabled={syncing}
            onClick={handleMarkSynced}
          >
            <CheckCircle2 className="mr-1.5 size-3" />
            {syncing ? "처리 중..." : "동기화 완료"}
          </Button>
        )}
      </div>

      {/* JSON 오류 메시지 */}
      {jsonError && (
        <div className="bg-destructive/10 px-4 py-1.5 text-xs text-destructive">
          JSON 오류: {jsonError}
        </div>
      )}

      {/* 에디터 본문 */}
      <div className="flex flex-1 overflow-hidden">
        {doc.doc_type === "md" ? (
          // Markdown 파일: 편집 / 미리보기 탭
          <Tabs
            defaultValue="edit"
            className="flex flex-1 flex-col overflow-hidden"
          >
            <TabsList className="mx-4 mt-2 h-7 w-fit">
              <TabsTrigger value="edit" className="h-5 text-xs">
                편집
              </TabsTrigger>
              <TabsTrigger value="preview" className="h-5 text-xs">
                미리보기
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="edit"
              className="mt-0 flex flex-1 overflow-hidden px-4 pb-4 pt-2"
            >
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                readOnly={isReadOnly}
                className={`flex-1 resize-none rounded-md border bg-background p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring ${
                  isReadOnly ? "cursor-not-allowed opacity-70" : ""
                }`}
                spellCheck={false}
                aria-label="마크다운 편집기"
              />
            </TabsContent>
            <TabsContent
              value="preview"
              className="mt-0 flex flex-1 overflow-auto px-4 pb-4 pt-2"
            >
              {/* 단순 pre 렌더링 (react-markdown 미설치 환경 대응) */}
              <pre className="flex-1 whitespace-pre-wrap rounded-md border bg-muted p-3 text-xs leading-relaxed">
                {content}
              </pre>
            </TabsContent>
          </Tabs>
        ) : (
          // JSON 파일: 단일 textarea
          <div className="flex flex-1 overflow-hidden px-4 pb-4 pt-3">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              readOnly={isReadOnly}
              className={`flex-1 resize-none rounded-md border bg-background p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring ${
                isReadOnly ? "cursor-not-allowed opacity-70" : ""
              } ${jsonError ? "border-destructive" : ""}`}
              spellCheck={false}
              aria-label="JSON 편집기"
            />
          </div>
        )}
      </div>

      {/* 버전 히스토리 다이얼로그 */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">
              버전 히스토리 — {fileName}
            </DialogTitle>
          </DialogHeader>
          <VersionHistoryPanel
            docPath={docPath}
            onRestore={() => {
              loadDoc();
              onMetaChange?.();
            }}
            onClose={() => setHistoryOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
