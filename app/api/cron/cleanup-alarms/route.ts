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
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  // 확인된 알람 중 confirmed_at 기준 12시간이 지난 것
  const { data: confirmedData, error: confirmedError } = await supabase
    .from("alarms")
    .delete()
    .eq("is_confirmed", true)
    .lt("confirmed_at", cutoff)
    .select("id");

  if (confirmedError) {
    return NextResponse.json(
      { error: confirmedError.message },
      { status: 500 }
    );
  }

  // 미확인 알람 중 scheduled_at 기준 12시간이 지난 것 (매우 오래된 미확인 알람)
  const { data: overdueData, error: overdueError } = await supabase
    .from("alarms")
    .delete()
    .eq("is_confirmed", false)
    .lt("scheduled_at", cutoff)
    .select("id");

  if (overdueError) {
    return NextResponse.json({ error: overdueError.message }, { status: 500 });
  }

  return NextResponse.json({
    confirmedDeleted: confirmedData?.length ?? 0,
    overdueDeleted: overdueData?.length ?? 0,
  });
}
