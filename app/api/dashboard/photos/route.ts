import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_PHOTOS = 10;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function GET(_req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photos, error } = await supabase
    .from("dashboard_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

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
      return { ...photo, url: data?.signedUrl ?? null };
    })
  );

  return NextResponse.json(photosWithUrl);
}

export async function DELETE(_req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photos, error: fetchError } = await supabase
    .from("dashboard_photos")
    .select("id, storage_path")
    .eq("user_id", user.id);

  if (fetchError) {
    return NextResponse.json(
      { error: "조회에 실패했습니다." },
      { status: 500 }
    );
  }

  if (!photos || photos.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const storagePaths = photos.map((p) => p.storage_path);
  await supabase.storage.from("case-photos").remove(storagePaths);

  const { error: deleteError } = await supabase
    .from("dashboard_photos")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: photos.length });
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

  // 현재 사진 수 조회
  const { count } = await supabase
    .from("dashboard_photos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  let autoDeleted = false;

  // 10장 이상이면 가장 오래된 사진 자동 삭제
  if ((count ?? 0) >= MAX_PHOTOS) {
    const { data: oldest } = await supabase
      .from("dashboard_photos")
      .select("id, storage_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (oldest) {
      await supabase.storage.from("case-photos").remove([oldest.storage_path]);
      await supabase.from("dashboard_photos").delete().eq("id", oldest.id);
      autoDeleted = true;
    }
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${user.id}/dashboard/${Date.now()}.${ext}`;
  const contentType = file.type || "image/jpeg";
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("case-photos")
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("[dashboard/photos] 업로드 실패:", uploadError.message);
    return NextResponse.json(
      { error: "사진 업로드에 실패했습니다." },
      { status: 500 }
    );
  }

  const { data: photo, error: insertError } = await supabase
    .from("dashboard_photos")
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
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

  return NextResponse.json({ ...photo, autoDeleted }, { status: 201 });
}
