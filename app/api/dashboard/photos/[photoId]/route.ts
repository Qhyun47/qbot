import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photo } = await supabase
    .from("dashboard_photos")
    .select("storage_path, user_id")
    .eq("id", photoId)
    .single();

  if (!photo || photo.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  // CDN 캐시 우회를 위해 새 경로에 저장
  const ext = photo.storage_path.split(".").pop() ?? "jpg";
  const newStoragePath = `dashboard/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("case-photos")
    .upload(newStoragePath, file);

  if (uploadError) {
    return NextResponse.json(
      { error: "사진 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  const { data: updated, error: dbError } = await supabase
    .from("dashboard_photos")
    .update({
      storage_path: newStoragePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    })
    .eq("id", photoId)
    .select("id");

  if (dbError || !updated || updated.length === 0) {
    await supabase.storage.from("case-photos").remove([newStoragePath]);
    return NextResponse.json(
      { error: "DB 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }

  // 이전 파일 삭제 (실패해도 무시)
  await supabase.storage.from("case-photos").remove([photo.storage_path]);

  return new NextResponse(null, { status: 204 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photo } = await supabase
    .from("dashboard_photos")
    .select("storage_path, user_id")
    .eq("id", photoId)
    .single();

  if (!photo || photo.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase.storage.from("case-photos").remove([photo.storage_path]);

  const { error } = await supabase
    .from("dashboard_photos")
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
