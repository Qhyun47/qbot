import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  // 만료된 case_photos 정리
  const { data: casePhotos } = await supabase
    .from("case_photos")
    .select("id, storage_path, cases!inner(created_at)")
    .eq("user_id", user.id)
    .filter("cases.created_at", "lt", cutoff);

  let casePhotosDeleted = 0;
  if (casePhotos && casePhotos.length > 0) {
    const storagePaths = casePhotos.map((p) => p.storage_path);
    const photoIds = casePhotos.map((p) => p.id);
    await supabase.storage.from("case-photos").remove(storagePaths);
    await supabase.from("case_photos").delete().in("id", photoIds);
    casePhotosDeleted = casePhotos.length;
  }

  // 만료된 dashboard_photos 정리
  const { data: dashboardPhotos } = await supabase
    .from("dashboard_photos")
    .select("id, storage_path")
    .eq("user_id", user.id)
    .lt("created_at", cutoff);

  let dashboardPhotosDeleted = 0;
  if (dashboardPhotos && dashboardPhotos.length > 0) {
    const storagePaths = dashboardPhotos.map((p) => p.storage_path);
    const photoIds = dashboardPhotos.map((p) => p.id);
    await supabase.storage.from("case-photos").remove(storagePaths);
    await supabase.from("dashboard_photos").delete().in("id", photoIds);
    dashboardPhotosDeleted = dashboardPhotos.length;
  }

  return NextResponse.json({ casePhotosDeleted, dashboardPhotosDeleted });
}
