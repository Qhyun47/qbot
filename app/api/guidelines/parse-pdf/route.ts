import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PDF_MAX_BYTES = 5 * 1024 * 1024; // 5MB

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
  const guideKey = formData.get("guideKey");
  const oldPdfPath = formData.get("oldPdfPath");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  if (file.size > PDF_MAX_BYTES) {
    return NextResponse.json(
      { error: "PDF 파일은 가이드라인 당 5MB를 초과할 수 없습니다." },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 기존 PDF Storage 파일 삭제
  if (typeof oldPdfPath === "string" && oldPdfPath) {
    await supabase.storage.from("guideline-pdfs").remove([oldPdfPath]);
  }

  // 새 PDF를 Storage에 업로드
  const storagePath = `${user.id}/${typeof guideKey === "string" && guideKey ? guideKey : Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("guideline-pdfs")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "PDF 업로드에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ storagePath });
}
