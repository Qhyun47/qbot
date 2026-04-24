"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadGuide } from "@/lib/ai/load-resources";
import type { Guideline } from "@/lib/supabase/types";
import ccListRaw from "@/lib/ai/resources/cc-list.json";
import guideListRaw from "@/lib/ai/resources/guide-list.json";

interface CcListEntry {
  cc: string;
  guideKeys: string[];
  templateKeys: string[];
  aliasOf?: string;
}

interface GuideListEntry {
  guideKey: string;
  displayName: string;
}

export type GuidelineData = {
  content: string | null;
  sourceType: string;
  pdfSignedUrl: string | null;
};

export type GuidelineResult =
  | ({ mode: "auto"; guideKey: string } & GuidelineData)
  | {
      mode: "recommendations";
      suggestions: { guideKey: string; displayName: string }[];
    }
  | { mode: "none" };

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다");
  return { supabase, user };
}

const guidelineSchema = z.object({
  guide_key: z.string().min(1, "가이드라인 키를 입력하세요"),
  content: z.string().min(1, "내용을 입력하세요"),
});

export async function upsertGuideline(
  guideKey: string,
  content: string,
  sourceType: string = "text",
  pdfPath?: string | null
): Promise<Guideline> {
  const parsed = guidelineSchema.parse({ guide_key: guideKey, content });
  const { supabase, user } = await getAuthUser();

  const { data: existing } = await supabase
    .from("interview_guidelines")
    .select("id")
    .eq("guide_key", parsed.guide_key)
    .eq("user_id", user.id)
    .maybeSingle();

  const payload = {
    content: parsed.content,
    source_type: sourceType,
    ...(pdfPath !== undefined ? { pdf_path: pdfPath } : {}),
  };

  let result;
  if (existing) {
    result = await supabase
      .from("interview_guidelines")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("interview_guidelines")
      .insert({ guide_key: parsed.guide_key, user_id: user.id, ...payload })
      .select()
      .single();
  }

  if (result.error || !result.data)
    throw new Error(result.error?.message ?? "가이드라인 저장 실패");

  revalidatePath("/guidelines");
  return result.data;
}

export async function deleteGuideline(guideKey: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  // PDF가 저장되어 있으면 Storage에서도 삭제
  const { data: existing } = await supabase
    .from("interview_guidelines")
    .select("pdf_path")
    .eq("guide_key", guideKey)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.pdf_path) {
    await supabase.storage.from("guideline-pdfs").remove([existing.pdf_path]);
  }

  const { error } = await supabase
    .from("interview_guidelines")
    .delete()
    .eq("guide_key", guideKey)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/guidelines");
}

export async function deleteGuidelinePdf(guideKey: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { data: existing } = await supabase
    .from("interview_guidelines")
    .select("pdf_path")
    .eq("guide_key", guideKey)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.pdf_path) {
    await supabase.storage.from("guideline-pdfs").remove([existing.pdf_path]);
    await supabase
      .from("interview_guidelines")
      .update({ pdf_path: null })
      .eq("guide_key", guideKey)
      .eq("user_id", user.id);
  }
}

export async function getCustomGuideline(
  guideKey: string
): Promise<Guideline | null> {
  const { supabase, user } = await getAuthUser();

  const { data } = await supabase
    .from("interview_guidelines")
    .select()
    .eq("guide_key", guideKey)
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? null;
}

export async function getGuidelinePdfSignedUrl(
  guideKey: string
): Promise<string> {
  const { supabase, user } = await getAuthUser();

  const { data: row } = await supabase
    .from("interview_guidelines")
    .select("pdf_path")
    .eq("guide_key", guideKey)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row?.pdf_path) throw new Error("PDF 경로를 찾을 수 없습니다.");

  const { data, error } = await supabase.storage
    .from("guideline-pdfs")
    .createSignedUrl(row.pdf_path, 3600);

  if (error || !data?.signedUrl)
    throw new Error("PDF URL 생성에 실패했습니다.");
  return data.signedUrl;
}

export async function loadGuideByKey(guideKey: string): Promise<GuidelineData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("interview_guidelines")
      .select("content, source_type, pdf_path")
      .eq("guide_key", guideKey)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      if (data.source_type === "pdf" && data.pdf_path) {
        const { data: signed, error } = await supabase.storage
          .from("guideline-pdfs")
          .createSignedUrl(data.pdf_path, 3600);
        return {
          content: null,
          sourceType: "pdf",
          pdfSignedUrl: error ? null : (signed?.signedUrl ?? null),
        };
      }
      if (data.content) {
        return {
          content: data.content,
          sourceType: data.source_type ?? "text",
          pdfSignedUrl: null,
        };
      }
    }
  }

  try {
    const systemContent = loadGuide(guideKey);
    return {
      content: systemContent || null,
      sourceType: "html",
      pdfSignedUrl: null,
    };
  } catch {
    return { content: null, sourceType: "text", pdfSignedUrl: null };
  }
}

export async function loadGuideline(cc: string): Promise<GuidelineResult> {
  const list = ccListRaw as CcListEntry[];
  const guideList = guideListRaw as GuideListEntry[];

  const item = list.find((i) => i.cc === cc);
  if (!item) return { mode: "none" };

  let guideKeys = item.guideKeys;
  if (item.aliasOf) {
    const parent = list.find((i) => i.cc === item.aliasOf);
    guideKeys = parent?.guideKeys ?? [];
  }

  if (guideKeys.length === 0) return { mode: "none" };

  if (guideKeys.length === 1) {
    const data = await loadGuideByKey(guideKeys[0]);
    if (!data.content && !data.pdfSignedUrl) return { mode: "none" };
    return { mode: "auto", guideKey: guideKeys[0], ...data };
  }

  const suggestions = guideKeys.map((key) => {
    const entry = guideList.find((g) => g.guideKey === key);
    return { guideKey: key, displayName: entry?.displayName ?? key };
  });
  return { mode: "recommendations", suggestions };
}

export async function listCustomGuidelines(): Promise<
  { guide_key: string; updated_at: string }[]
> {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("interview_guidelines")
    .select("guide_key, updated_at")
    .eq("user_id", user.id)
    .order("guide_key");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllCustomGuidelines(): Promise<Guideline[]> {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("interview_guidelines")
    .select()
    .eq("user_id", user.id)
    .order("guide_key");

  if (error) throw new Error(error.message);
  return data ?? [];
}
