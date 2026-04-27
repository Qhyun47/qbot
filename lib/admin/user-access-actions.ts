"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { revalidatePath } from "next/cache";
import { ServiceAccessStatus } from "@/lib/supabase/types";

export interface ServiceAccessUser {
  id: string;
  email: string | null;
  full_name: string | null;
  service_access_status: ServiceAccessStatus;
  is_admin: boolean;
  created_at: string;
}

async function buildEmailMap(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return new Map((data?.users ?? []).map((u) => [u.id, u.email ?? null]));
}

export async function getPendingUsers(): Promise<ServiceAccessUser[]> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  try {
    const supabase = createAdminClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, service_access_status, is_admin, created_at")
      .in("service_access_status", ["pending", "held"])
      .order("created_at", { ascending: true });

    const emailMap = await buildEmailMap(supabase);

    return (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? null,
    })) as ServiceAccessUser[];
  } catch {
    return [];
  }
}

export async function getAllUsers(): Promise<ServiceAccessUser[]> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return [];

  try {
    const supabase = createAdminClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, service_access_status, is_admin, created_at")
      .order("created_at", { ascending: false });

    const emailMap = await buildEmailMap(supabase);

    return (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? null,
    })) as ServiceAccessUser[];
  } catch {
    return [];
  }
}

export async function getPendingCount(): Promise<number> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return 0;

  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("service_access_status", ["pending", "held"]);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function approveServiceAccess(
  userId: string
): Promise<{ error?: string }> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return { error: "권한이 없습니다." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ service_access_status: "approved" })
      .eq("id", userId);
    if (error) return { error: "승인 처리에 실패했습니다." };
  } catch {
    return { error: "승인 처리에 실패했습니다." };
  }

  revalidatePath("/admin/users");
  return {};
}

export async function approveServiceAccessAiExcluded(
  userId: string
): Promise<{ error?: string }> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return { error: "권한이 없습니다." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ service_access_status: "ai_excluded" })
      .eq("id", userId);
    if (error) return { error: "AI 제외 승인 처리에 실패했습니다." };
  } catch {
    return { error: "AI 제외 승인 처리에 실패했습니다." };
  }

  revalidatePath("/admin/users");
  return {};
}

export async function denyServiceAccess(
  userId: string
): Promise<{ error?: string }> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return { error: "권한이 없습니다." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ service_access_status: "denied" })
      .eq("id", userId);
    if (error) return { error: "거절 처리에 실패했습니다." };
  } catch {
    return { error: "거절 처리에 실패했습니다." };
  }

  revalidatePath("/admin/users");
  return {};
}

export async function holdServiceAccess(
  userId: string
): Promise<{ error?: string }> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return { error: "권한이 없습니다." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ service_access_status: "held" })
      .eq("id", userId);
    if (error) return { error: "보류 처리에 실패했습니다." };
  } catch {
    return { error: "보류 처리에 실패했습니다." };
  }

  revalidatePath("/admin/users");
  return {};
}

export async function updateServiceAccessStatus(
  userId: string,
  status: ServiceAccessStatus
): Promise<{ error?: string }> {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return { error: "권한이 없습니다." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ service_access_status: status })
      .eq("id", userId);
    if (error) return { error: "상태 변경에 실패했습니다." };
  } catch {
    return { error: "상태 변경에 실패했습니다." };
  }

  revalidatePath("/admin/users");
  return {};
}
