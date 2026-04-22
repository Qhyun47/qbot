import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Google OAuth 완료 후 Supabase가 리다이렉트하는 콜백 라우트.
 * URL의 code를 세션으로 교환한 뒤 목적지로 이동합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase가 전달하는 인가 코드
  const code = searchParams.get("code");

  // 로그인 성공 후 이동할 경로 — 슬래시로 시작하는 상대 경로만 허용 (오픈 리다이렉트 방지)
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const redirectUrl = `${origin}${next}`;

      // Google 메타데이터로 프로필 생성 또는 갱신 (행이 없으면 생성, 있으면 이름 갱신)
      const { id, user_metadata } = data.user;
      await supabase.from("profiles").upsert(
        {
          id,
          full_name: user_metadata.full_name ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      return NextResponse.redirect(redirectUrl);
    }
  }

  // 코드가 없거나 세션 교환 실패 시 에러 페이지로 이동
  return NextResponse.redirect(`${origin}/auth/error`);
}
