import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TranscriptSegment } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const GROQ_MAX_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(
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

  const { data: caseRow } = await supabase
    .from("cases")
    .select("user_id")
    .eq("id", caseId)
    .single();
  if (!caseRow || caseRow.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: recording } = await supabase
    .from("case_recordings")
    .select("*")
    .eq("id", recordingId)
    .eq("case_id", caseId)
    .single();

  if (!recording) {
    return NextResponse.json(
      { error: "녹음을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // processing 상태로 변경
  await supabase
    .from("case_recordings")
    .update({ transcript_status: "processing" })
    .eq("id", recordingId);

  try {
    const adminClient = createAdminClient();
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("case-recordings")
      .download(recording.storage_path);

    if (downloadError || !fileData) {
      throw new Error("파일 다운로드 실패");
    }

    const buffer = await fileData.arrayBuffer();

    if (buffer.byteLength > GROQ_MAX_BYTES) {
      await supabase
        .from("case_recordings")
        .update({ transcript_status: "failed" })
        .eq("id", recordingId);
      return NextResponse.json(
        { error: "파일이 너무 커서 변환할 수 없습니다. (최대 25MB)" },
        { status: 400 }
      );
    }

    const ext = recording.storage_path.split(".").pop() ?? "webm";
    const mimeType = ext === "mp4" ? "audio/mp4" : "audio/webm";
    const audioFile = new File([buffer], `recording.${ext}`, {
      type: mimeType,
    });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = (await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      language: "ko",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })) as {
      text: string;
      segments?: { text: string; start: number; end: number }[];
    };

    const segments: TranscriptSegment[] = (result.segments ?? [])
      .map((s) => ({ text: s.text.trim(), start: s.start, end: s.end }))
      .filter((s) => s.text.length > 0);

    await supabase
      .from("case_recordings")
      .update({ transcript: segments, transcript_status: "done" })
      .eq("id", recordingId);

    return NextResponse.json({ ok: true, segments: segments.length });
  } catch (err) {
    await supabase
      .from("case_recordings")
      .update({ transcript_status: "failed" })
      .eq("id", recordingId);
    const message =
      err instanceof Error ? err.message : "STT 변환에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
