"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FoldFallbackLayout, InputLayout } from "@/lib/supabase/types";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다");
  return { supabase, user };
}

const layoutSchema = z.enum(["single", "split_vertical", "split_horizontal"]);
const splitRatioSchema = z.number().int().min(30).max(70);
const mobileFontSizeSchema = z.union([
  z.literal(10),
  z.literal(12),
  z.literal(14),
  z.literal(16),
  z.literal(18),
  z.literal(20),
]);
const foldFallbackLayoutSchema = z.enum(["single", "split_vertical"]);

export async function updateInputLayout(layout: InputLayout): Promise<void> {
  const parsed = layoutSchema.parse(layout);
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("profiles")
    .update({ input_layout: parsed })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/cases/new");
}

export async function updateLayoutSettings(
  layout: InputLayout,
  splitRatio: number,
  mobileFontSize: number,
  foldAutoSwitch: boolean,
  foldFallbackLayout: FoldFallbackLayout,
  caseInputFontSize: number
): Promise<void> {
  const parsedLayout = layoutSchema.parse(layout);
  const parsedRatio = splitRatioSchema.parse(splitRatio);
  const parsedFontSize = mobileFontSizeSchema.parse(mobileFontSize);
  const parsedCaseInputFontSize = mobileFontSizeSchema.parse(caseInputFontSize);
  const parsedFoldFallback = foldFallbackLayoutSchema.parse(foldFallbackLayout);
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      input_layout: parsedLayout,
      split_ratio: parsedRatio,
      mobile_font_size: parsedFontSize,
      case_input_font_size: parsedCaseInputFontSize,
      fold_auto_switch: foldAutoSwitch,
      fold_fallback_layout: parsedFoldFallback,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/cases/new");
}

export async function getInputLayout(): Promise<InputLayout> {
  const { supabase, user } = await getAuthUser();

  const { data } = await supabase
    .from("profiles")
    .select("input_layout")
    .eq("id", user.id)
    .maybeSingle();

  return data?.input_layout ?? "single";
}

export async function getLayoutSettings(): Promise<{
  layout: InputLayout;
  splitRatio: number;
  mobileFontSize: number;
  caseInputFontSize: number;
  foldAutoSwitch: boolean;
  foldFallbackLayout: FoldFallbackLayout;
}> {
  const { supabase, user } = await getAuthUser();

  const { data } = await supabase
    .from("profiles")
    .select(
      "input_layout, split_ratio, mobile_font_size, case_input_font_size, fold_auto_switch, fold_fallback_layout"
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    layout: data?.input_layout ?? "single",
    splitRatio: data?.split_ratio ?? 50,
    mobileFontSize: data?.mobile_font_size ?? 16,
    caseInputFontSize: data?.case_input_font_size ?? 16,
    foldAutoSwitch: data?.fold_auto_switch ?? false,
    foldFallbackLayout:
      (data?.fold_fallback_layout as FoldFallbackLayout) ?? "single",
  };
}
