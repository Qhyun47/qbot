import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  // CDN 캐시 우회를 위해 새 경로에 저장 (기존 경로 덮어쓰기 금지)
  const dir = photo.storage_path.split("/").slice(0, -1).join("/");
  const ext = photo.storage_path.split(".").pop() ?? "jpg";
  const newStoragePath = `${dir}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("case-photos")
    .upload(newStoragePath, file);

  if (uploadError) {
    return NextResponse.json(
      { error: "사진 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  const { error: dbError } = await supabase
    .from("case_photos")
    .update({
      storage_path: newStoragePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    })
    .eq("id", photoId);

  if (dbError) {
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
