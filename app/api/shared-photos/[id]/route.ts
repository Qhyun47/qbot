import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photo, error: fetchError } = await supabase
    .from("shared_photos")
    .select("id, storage_path, shared_by")
    .eq("id", id)
    .single();

  if (fetchError || !photo) {
    return NextResponse.json(
      { error: "사진을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (photo.shared_by !== user.id) {
    return NextResponse.json(
      { error: "삭제 권한이 없습니다." },
      { status: 403 }
    );
  }

  await supabase.storage.from("case-photos").remove([photo.storage_path]);

  const { error: deleteError } = await supabase
    .from("shared_photos")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
