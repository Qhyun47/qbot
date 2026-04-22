"use server";

import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { revalidatePath } from "next/cache";

// 문서 메타데이터 타입 (목록용, content 제외)
export type DocumentMeta = {
  doc_path: string;
  doc_type: "md" | "json";
  is_editable: boolean;
  version: number;
  synced_at: string | null;
  updated_at: string;
};

// 문서 전체 타입 (content 포함)
export type DocumentFull = DocumentMeta & {
  content: string;
};

// 버전 히스토리 타입
export type DocumentVersionItem = {
  id: string;
  version: number;
  changed_by: string;
  change_summary: string | null;
  created_at: string;
  content: string;
};

/**
 * 관리자 권한을 확인하고, 비관리자면 에러를 던집니다.
 */
async function assertAdmin(): Promise<void> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

/**
 * DB에서 모든 문서 메타데이터를 조회합니다. (content 제외, 목록용)
 */
export async function getDocuments(): Promise<DocumentMeta[]> {
  await assertAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_documents")
    .select("doc_path, doc_type, is_editable, version, synced_at, updated_at")
    .order("doc_path");

  if (error) throw new Error(`문서 목록 조회 실패: ${error.message}`);

  return (data ?? []) as DocumentMeta[];
}

/**
 * 특정 문서의 전체 내용을 조회합니다. (content 포함)
 */
export async function getDocument(
  docPath: string
): Promise<DocumentFull | null> {
  await assertAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_documents")
    .select(
      "doc_path, doc_type, content, is_editable, version, synced_at, updated_at"
    )
    .eq("doc_path", docPath)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // 문서 없음
    throw new Error(`문서 조회 실패: ${error.message}`);
  }

  return data as DocumentFull;
}

/**
 * 문서를 저장합니다.
 * - is_editable=false인 문서는 저장을 거부합니다.
 * - 저장 전 현재 내용을 ai_document_versions에 백업합니다.
 * - version +1, synced_at = null로 리셋합니다. (미동기화 표시)
 */
export async function saveDocument(
  docPath: string,
  content: string,
  changeSummary?: string
): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();

  // 현재 문서 조회 (백업 및 editable 확인용)
  const { data: current, error: fetchError } = await supabase
    .from("ai_documents")
    .select("content, is_editable, version")
    .eq("doc_path", docPath)
    .single();

  if (fetchError) throw new Error(`문서 조회 실패: ${fetchError.message}`);
  if (!current) throw new Error(`문서를 찾을 수 없습니다: ${docPath}`);
  if (!current.is_editable) {
    throw new Error(`이 문서는 편집할 수 없습니다 (읽기 전용): ${docPath}`);
  }

  const nextVersion = current.version + 1;

  // 현재 내용을 버전 히스토리에 백업
  const { error: versionError } = await supabase
    .from("ai_document_versions")
    .insert({
      doc_path: docPath,
      content: current.content,
      version: current.version,
      changed_by: "admin",
      change_summary: changeSummary ?? null,
    });

  if (versionError) {
    throw new Error(`버전 히스토리 저장 실패: ${versionError.message}`);
  }

  // 문서 업데이트: version +1, synced_at = null (미동기화 표시)
  const { error: updateError } = await supabase
    .from("ai_documents")
    .update({
      content,
      version: nextVersion,
      synced_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("doc_path", docPath);

  if (updateError) {
    throw new Error(`문서 저장 실패: ${updateError.message}`);
  }

  revalidatePath("/admin/documents");
}

/**
 * synced_at을 현재 시각으로 업데이트합니다. (동기화 완료 표시)
 */
export async function markSynced(docPath: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_documents")
    .update({ synced_at: new Date().toISOString() })
    .eq("doc_path", docPath);

  if (error) throw new Error(`동기화 표시 업데이트 실패: ${error.message}`);

  revalidatePath("/admin/documents");
}

/**
 * 특정 문서의 버전 히스토리를 조회합니다. (최근 10개)
 */
export async function getDocumentVersions(
  docPath: string
): Promise<DocumentVersionItem[]> {
  await assertAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_document_versions")
    .select("id, version, changed_by, change_summary, created_at, content")
    .eq("doc_path", docPath)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`버전 히스토리 조회 실패: ${error.message}`);
  }

  return (data ?? []) as DocumentVersionItem[];
}

/**
 * 특정 버전으로 문서를 복원합니다.
 * 복원 시 현재 내용을 버전 히스토리에 먼저 백업합니다.
 */
export async function restoreVersion(
  docPath: string,
  versionId: string
): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();

  // 복원할 버전의 content 조회
  const { data: targetVersion, error: versionFetchError } = await supabase
    .from("ai_document_versions")
    .select("content, version")
    .eq("id", versionId)
    .eq("doc_path", docPath)
    .single();

  if (versionFetchError || !targetVersion) {
    throw new Error(`복원할 버전을 찾을 수 없습니다: ${versionId}`);
  }

  // 복원 = 해당 버전 content로 saveDocument 호출
  await saveDocument(
    docPath,
    targetVersion.content,
    `v${targetVersion.version}으로 복원`
  );
}
