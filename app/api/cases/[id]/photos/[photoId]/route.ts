import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id: caseId, photoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photo } = await supabase
    .from("case_photos")
    .select("storage_path, user_id, case_id")
    .eq("id", photoId)
    .single();

  if (!photo || photo.user_id !== user.id || photo.case_id !== caseId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.storage.from("case-photos").remove([photo.storage_path]);

  const { error } = await supabase
    .from("case_photos")
    .delete()
    .eq("id", photoId);

  if (error) {
    return NextResponse.json(
      { error: "사진 삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
