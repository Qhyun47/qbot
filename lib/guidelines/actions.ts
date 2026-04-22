"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadGuide } from "@/lib/ai/load-resources";
import type { Guideline } from "@/lib/supabase/types";
import ccListRaw from "@/lib/ai/resources/cc-list.json";

interface CcListEntry {
  cc: string;
  guideKeys: string[];
  templateKeys: string[];
  aliasOf?: string;
}

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다");
  return { supabase, user };
}

const guidelineSchema = z.object({
  cc: z.string().min(1, "C.C.를 입력하세요"),
  content: z.string().min(1, "내용을 입력하세요"),
});

export async function upsertGuideline(
  cc: string,
  content: string
): Promise<Guideline> {
  const parsed = guidelineSchema.parse({ cc, content });
  const { supabase, user } = await getAuthUser();

  const { data: existing } = await supabase
    .from("interview_guidelines")
    .select("id")
    .eq("cc", parsed.cc)
    .eq("user_id", user.id)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from("interview_guidelines")
      .update({ content: parsed.content })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("interview_guidelines")
      .insert({ cc: parsed.cc, content: parsed.content, user_id: user.id })
      .select()
      .single();
  }

  if (result.error || !result.data)
    throw new Error(result.error?.message ?? "가이드라인 저장 실패");

  revalidatePath("/guidelines");
  return result.data;
}

export async function deleteGuideline(cc: string): Promise<void> {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("interview_guidelines")
    .delete()
    .eq("cc", cc)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/guidelines");
}

export async function getCustomGuideline(
  cc: string
): Promise<Guideline | null> {
  const { supabase, user } = await getAuthUser();

  const { data } = await supabase
    .from("interview_guidelines")
    .select()
    .eq("cc", cc)
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? null;
}

function findGuideKey(cc: string): string | null {
  const list = ccListRaw as CcListEntry[];
  const item = list.find((i) => i.cc === cc);
  if (!item) return null;
  if (item.aliasOf) {
    const parent = list.find((i) => i.cc === item.aliasOf);
    return parent?.guideKeys[0] ?? null;
  }
  return item.guideKeys[0] ?? null;
}

export async function loadGuideline(
  cc: string
): Promise<{ systemContent: string | null; customContent: string | null }> {
  const { supabase, user } = await getAuthUser();

  const { data } = await supabase
    .from("interview_guidelines")
    .select("content")
    .eq("cc", cc)
    .eq("user_id", user.id)
    .maybeSingle();

  const customContent = data?.content ?? null;

  const templateKey = findGuideKey(cc);
  let systemContent: string | null = null;
  if (templateKey) {
    try {
      systemContent = loadGuide(templateKey) || null;
    } catch {
      systemContent = null;
    }
  }

  return { systemContent, customContent };
}

export async function listCustomGuidelines(): Promise<
  { cc: string; updated_at: string }[]
> {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("interview_guidelines")
    .select("cc, updated_at")
    .eq("user_id", user.id)
    .order("cc");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllCustomGuidelines(): Promise<Guideline[]> {
  const { supabase, user } = await getAuthUser();

  const { data, error } = await supabase
    .from("interview_guidelines")
    .select()
    .eq("user_id", user.id)
    .order("cc");

  if (error) throw new Error(error.message);
  return data ?? [];
}
