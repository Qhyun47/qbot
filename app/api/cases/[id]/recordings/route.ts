import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 100 * 1024 * 1024; // 100MB

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

  const { data: recordings, error } = await supabase
    .from("case_recordings")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "조회에 실패했습니다." },
      { status: 500 }
    );
  }

  const recordingsWithUrl = await Promise.all(
    (recordings ?? []).map(async (recording) => {
      const { data } = await supabase.storage
        .from("case-recordings")
        .createSignedUrl(recording.storage_path, 3600);
      return { ...recording, url: data?.signedUrl ?? null };
    })
  );

  return NextResponse.json(recordingsWithUrl);
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

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "녹음 파일은 100MB를 초과할 수 없습니다." },
      { status: 413 }
    );
  }

  const durationRaw = formData.get("duration_seconds");
  const durationSeconds = durationRaw ? Math.round(Number(durationRaw)) : null;

  const ext = file.name.split(".").pop() ?? "webm";
  const fileId = crypto.randomUUID();
  const storagePath = `${user.id}/${caseId}/${fileId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("case-recordings")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "녹음 업로드에 실패했습니다." },
      { status: 500 }
    );
  }

  const { data: recording, error: insertError } = await supabase
    .from("case_recordings")
    .insert({
      case_id: caseId,
      user_id: user.id,
      storage_path: storagePath,
      duration_seconds: durationSeconds,
      transcript_status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from("case-recordings").remove([storagePath]);
    return NextResponse.json(
      { error: "녹음 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  // 업로드 완료 후 STT 트리거 (fire-and-forget)
  const baseUrl = req.nextUrl.origin;
  fetch(
    `${baseUrl}/api/cases/${caseId}/recordings/${recording.id}/transcribe`,
    {
      method: "POST",
    }
  ).catch(() => {});

  return NextResponse.json(recording, { status: 201 });
}
