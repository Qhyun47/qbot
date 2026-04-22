"use server";

import { createClient } from "@/lib/supabase/server";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { revalidatePath } from "next/cache";

export interface AiAccessUser {
  id: string;
  ai_access_name: string | null;
  ai_access_status: "none" | "pending" | "approved" | "denied";
  ai_access_requested_at: string | null;
  email: string | null;
}

export async function getPendingUsers(): Promise<AiAccessUser[]> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_access_requests")
    .select("*")
    .eq("ai_access_status", "pending")
    .order("ai_access_requested_at", { ascending: true });

  return (data ?? []) as AiAccessUser[];
}

export async function getAllAiUsers(): Promise<AiAccessUser[]> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_access_requests")
    .select("*")
    .order("ai_access_requested_at", { ascending: false });

  return (data ?? []) as AiAccessUser[];
}

export async function approveAiAccess(
  userId: string
): Promise<{ error?: string }> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return { error: "권한이 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ai_access_status: "approved" })
    .eq("id", userId);

  if (error) return { error: "승인 처리에 실패했습니다." };

  revalidatePath("/admin/users");
  return {};
}

export async function denyAiAccess(
  userId: string
): Promise<{ error?: string }> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return { error: "권한이 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ai_access_status: "denied" })
    .eq("id", userId);

  if (error) return { error: "거부 처리에 실패했습니다." };

  revalidatePath("/admin/users");
  return {};
}

export async function getPendingCount(): Promise<number> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("ai_access_status", "pending");

  return count ?? 0;
}
