import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 12시간 이전 케이스에 첨부된 사진 조회
  const { data: photos, error: fetchError } = await supabase
    .from("case_photos")
    .select("id, storage_path, cases!inner(created_at)")
    .filter(
      "cases.created_at",
      "lt",
      new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    );

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const storagePaths = photos.map((p) => p.storage_path);
  const photoIds = photos.map((p) => p.id);

  // Storage 파일 삭제 (실패해도 DB 삭제 계속 진행)
  await supabase.storage.from("case-photos").remove(storagePaths);

  // DB 행 삭제
  const { error: deleteError } = await supabase
    .from("case_photos")
    .delete()
    .in("id", photoIds);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 12시간 이상 된 대시보드 사진 삭제 (케이스 삭제와 독립적으로 처리)
  let dashboardDeleted = 0;
  try {
    const { data: dashboardPhotos } = await supabase
      .from("dashboard_photos")
      .select("id, storage_path")
      .lt(
        "created_at",
        new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      );

    if (dashboardPhotos && dashboardPhotos.length > 0) {
      const dashboardPaths = dashboardPhotos.map((p) => p.storage_path);
      const dashboardIds = dashboardPhotos.map((p) => p.id);

      await supabase.storage.from("case-photos").remove(dashboardPaths);
      await supabase.from("dashboard_photos").delete().in("id", dashboardIds);
      dashboardDeleted = dashboardPhotos.length;
    }
  } catch {
    // 대시보드 사진 삭제 실패는 전체 응답에 영향 없음
  }

  // 12시간 이상 된 공유 사진 삭제
  let sharedDeleted = 0;
  try {
    const { data: sharedPhotos } = await supabase
      .from("shared_photos")
      .select("id, storage_path")
      .lt(
        "created_at",
        new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      );

    if (sharedPhotos && sharedPhotos.length > 0) {
      const sharedPaths = sharedPhotos.map((p) => p.storage_path);
      const sharedIds = sharedPhotos.map((p) => p.id);

      await supabase.storage.from("case-photos").remove(sharedPaths);
      await supabase.from("shared_photos").delete().in("id", sharedIds);
      sharedDeleted = sharedPhotos.length;
    }
  } catch {
    // 공유 사진 삭제 실패는 전체 응답에 영향 없음
  }

  return NextResponse.json({
    deleted: photos.length,
    dashboardDeleted,
    sharedDeleted,
  });
}
