import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  const { error } = await supabase.from("shared_photo_hides").upsert({
    shared_photo_id: id,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json(
      { error: "숨기기에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
