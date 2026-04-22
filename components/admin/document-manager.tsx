"use client";

import { useState, useCallback, useTransition } from "react";
import { FileText } from "lucide-react";
import { DocumentTree } from "@/components/admin/document-tree";
import { DocumentEditor } from "@/components/admin/document-editor";
import { getDocuments } from "@/lib/admin/document-actions";
import type { DocumentMeta } from "@/lib/admin/document-actions";

interface DocumentManagerProps {
  initialDocuments: DocumentMeta[];
}

/**
 * AI 문서 관리 전체 레이아웃 컴포넌트.
 * 좌측 파일 트리 + 우측 에디터 영역으로 구성됩니다.
 */
export function DocumentManager({ initialDocuments }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentMeta[]>(initialDocuments);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // 저장/동기화 후 파일 트리의 메타 정보를 갱신합니다.
  const refreshDocuments = useCallback(() => {
    startTransition(async () => {
      try {
        const updated = await getDocuments();
        setDocuments(updated);
      } catch {
        // 갱신 실패 시 기존 목록 유지
      }
    });
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 좌측 파일 트리 (280px 고정) */}
      <aside className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-r bg-muted/30">
        <div className="border-b px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            문서
          </span>
          <span className="ml-1.5 text-xs text-muted-foreground">
            ({documents.length})
          </span>
        </div>
        <DocumentTree
          documents={documents}
          selectedPath={selectedPath}
          onSelectFile={setSelectedPath}
        />
      </aside>

      {/* 우측 에디터 영역 */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {selectedPath ? (
          <DocumentEditor
            key={selectedPath}
            docPath={selectedPath}
            onMetaChange={refreshDocuments}
          />
        ) : (
          // 파일 미선택 안내 화면
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-muted p-4">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">파일을 선택하세요</p>
              <p className="mt-1 text-xs text-muted-foreground">
                좌측 파일 트리에서 편집할 문서를 클릭하세요.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
