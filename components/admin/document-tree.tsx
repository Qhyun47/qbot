"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Braces,
  FolderOpen,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentMeta } from "@/lib/admin/document-actions";

interface DocumentTreeProps {
  documents: DocumentMeta[];
  selectedPath: string | null;
  onSelectFile: (docPath: string) => void;
}

// 트리 노드 구조 타입
type TreeNode =
  | { type: "file"; path: string; name: string; meta: DocumentMeta }
  | { type: "folder"; name: string; children: TreeNode[] };

/**
 * doc_path 목록을 폴더 트리 구조로 파싱합니다.
 * 예: "cc/chest-pain/template" → cc/ > chest-pain/ > template
 */
function buildTree(documents: DocumentMeta[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const doc of documents) {
    const parts = doc.doc_path.split("/");
    let current = root;

    // 마지막 파트는 파일명, 나머지는 폴더
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      let folder = current.find(
        (n): n is Extract<TreeNode, { type: "folder" }> =>
          n.type === "folder" && n.name === folderName
      );
      if (!folder) {
        folder = { type: "folder", name: folderName, children: [] };
        current.push(folder);
      }
      current = folder.children;
    }

    // 파일 노드 추가
    const fileName = parts[parts.length - 1];
    current.push({
      type: "file",
      path: doc.doc_path,
      name: fileName,
      meta: doc,
    });
  }

  return root;
}

/**
 * 문서가 미동기화 상태인지 확인합니다.
 * synced_at이 null이거나 updated_at이 synced_at보다 이후면 미동기화입니다.
 */
function isUnsynced(meta: DocumentMeta): boolean {
  if (!meta.synced_at) return true;
  return new Date(meta.updated_at) > new Date(meta.synced_at);
}

// 파일 아이콘 컴포넌트
function FileIcon({ docType }: { docType: "md" | "json" }) {
  if (docType === "json") {
    return <Braces className="size-3.5 shrink-0 text-amber-500" />;
  }
  return <FileText className="size-3.5 shrink-0 text-blue-400" />;
}

// 파일 노드 컴포넌트
function FileNode({
  node,
  selectedPath,
  onSelectFile,
  depth,
}: {
  node: Extract<TreeNode, { type: "file" }>;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth: number;
}) {
  const isSelected = selectedPath === node.path;
  const unsynced = isUnsynced(node.meta);

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-left text-xs transition-colors",
        isSelected
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
      aria-label={`${node.path} 파일 선택`}
    >
      <FileIcon docType={node.meta.doc_type} />
      <span className="truncate">{node.name}</span>
      {/* 미동기화 배지 */}
      {unsynced && (
        <span
          className="ml-auto shrink-0 text-[10px] text-amber-500"
          title="프로젝트 파일과 동기화되지 않음"
        >
          ⚠
        </span>
      )}
      {/* 읽기 전용 배지 */}
      {!node.meta.is_editable && (
        <span
          className="ml-auto shrink-0 text-[10px] text-muted-foreground"
          title="읽기 전용"
        >
          🔒
        </span>
      )}
    </button>
  );
}

// 폴더 노드 컴포넌트
function FolderNode({
  node,
  selectedPath,
  onSelectFile,
  depth,
  defaultOpen,
}: {
  node: Extract<TreeNode, { type: "folder" }>;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        className="flex w-full items-center gap-1 rounded-sm py-1 pr-2 text-xs text-foreground transition-colors hover:bg-accent/50"
        aria-label={`${node.name} 폴더 ${open ? "접기" : "펼치기"}`}
      >
        {open ? (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
        )}
        {open ? (
          <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="font-medium">{node.name}/</span>
      </button>
      {open && (
        <div>
          {node.children.map((child) =>
            child.type === "folder" ? (
              <FolderNode
                key={child.name}
                node={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                depth={depth + 1}
              />
            ) : (
              <FileNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                depth={depth + 1}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * VSCode 스타일 파일 트리 컴포넌트.
 * doc_path를 폴더 구조로 파싱하여 렌더링합니다.
 */
export function DocumentTree({
  documents,
  selectedPath,
  onSelectFile,
}: DocumentTreeProps) {
  const tree = buildTree(documents);

  return (
    <div className="py-1">
      {tree.map((node) =>
        node.type === "folder" ? (
          <FolderNode
            key={node.name}
            node={node}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            depth={0}
            // prompts 폴더는 기본으로 펼침
            defaultOpen={node.name === "prompts"}
          />
        ) : (
          <FileNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            depth={0}
          />
        )
      )}
    </div>
  );
}
