import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pageUrl, errorMessage, stackTrace } = body;

    if (!pageUrl || !errorMessage) {
      return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("error_logs").insert({
      user_id: user?.id ?? null,
      page_url: String(pageUrl).slice(0, 2000),
      error_message: String(errorMessage).slice(0, 2000),
      stack_trace: stackTrace ? String(stackTrace).slice(0, 5000) : null,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
