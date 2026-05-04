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

  const { data: recordings, error: fetchError } = await supabase
    .from("case_recordings")
    .select("id, storage_path, cases!inner(created_at)")
    .filter(
      "cases.created_at",
      "lt",
      new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    );

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!recordings || recordings.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const storagePaths = recordings.map((r) => r.storage_path);
  const recordingIds = recordings.map((r) => r.id);

  await supabase.storage.from("case-recordings").remove(storagePaths);

  const { error: deleteError } = await supabase
    .from("case_recordings")
    .delete()
    .in("id", recordingIds);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: recordings.length });
}
