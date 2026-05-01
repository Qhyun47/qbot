import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { data: row } = await supabase
    .from("cases")
    .select("id, status, current_result_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!row) {
    return NextResponse.json(
      { error: "환자를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    caseId: row.id,
    status: row.status,
    currentResultId: row.current_result_id,
  });
}
