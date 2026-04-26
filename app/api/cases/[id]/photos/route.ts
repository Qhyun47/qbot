import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
const MAX_PHOTOS = 10;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("user_id")
    .eq("id", caseId)
    .single();
  if (!caseRow || caseRow.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: photos, error } = await supabase
    .from("case_photos")
    .select("*")
    .eq("case_id", caseId)
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("user_id")
    .eq("id", caseId)
    .single();
  if (!caseRow || caseRow.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { count } = await supabase
    .from("case_photos")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);
  if ((count ?? 0) >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.` },
      { status: 400 }
    );
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

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileId = crypto.randomUUID();
  const storagePath = `${user.id}/${caseId}/${fileId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("case-photos")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "사진 업로드에 실패했습니다." },
      { status: 500 }
    );
  }

  const { data: photo, error: insertError } = await supabase
    .from("case_photos")
    .insert({
      case_id: caseId,
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

  return NextResponse.json(photo, { status: 201 });
}
