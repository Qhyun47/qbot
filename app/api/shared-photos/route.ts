import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function GET(_req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 현재 사용자가 숨긴 사진 ID 조회
  const { data: hides } = await supabase
    .from("shared_photo_hides")
    .select("shared_photo_id")
    .eq("user_id", user.id);

  const hiddenIds = (hides ?? []).map((h) => h.shared_photo_id);

  // 숨긴 사진 제외하고 전체 공유 사진 조회
  let query = supabase
    .from("shared_photos")
    .select("*")
    .order("created_at", { ascending: true });

  if (hiddenIds.length > 0) {
    query = query.not("id", "in", `(${hiddenIds.join(",")})`);
  }

  const { data: photos, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "조회에 실패했습니다." },
      { status: 500 }
    );
  }

  const photosWithUrl = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("case-photos")
        .createSignedUrl(photo.storage_path, 3600);
      return {
        ...photo,
        url: data?.signedUrl ?? null,
        is_owner: photo.shared_by === user.id,
      };
    })
  );

  return NextResponse.json(photosWithUrl);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "사진 파일은 10MB를 초과할 수 없습니다." },
      { status: 413 }
    );
  }

  const photoId = crypto.randomUUID();
  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `shared/${photoId}.${ext}`;
  const contentType = file.type || "image/jpeg";
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("case-photos")
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "사진 업로드에 실패했습니다." },
      { status: 500 }
    );
  }

  const { data: photo, error: insertError } = await supabase
    .from("shared_photos")
    .insert({
      id: photoId,
      shared_by: user.id,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || "image/jpeg",
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from("case-photos").remove([storagePath]);
    return NextResponse.json(
      { error: "사진 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  const { data: signedUrlData } = await supabase.storage
    .from("case-photos")
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json(
    { ...photo, url: signedUrlData?.signedUrl ?? null, is_owner: true },
    { status: 201 }
  );
}
