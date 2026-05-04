import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; recordingId: string }> }
) {
  const { id: caseId, recordingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: recording } = await supabase
    .from("case_recordings")
    .select("storage_path, user_id, case_id")
    .eq("id", recordingId)
    .single();

  if (
    !recording ||
    recording.user_id !== user.id ||
    recording.case_id !== caseId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.storage
    .from("case-recordings")
    .remove([recording.storage_path]);

  const { error } = await supabase
    .from("case_recordings")
    .delete()
    .eq("id", recordingId);

  if (error) {
    return NextResponse.json(
      { error: "녹음 삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
