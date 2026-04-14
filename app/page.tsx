import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 로그인된 사용자를 대시보드로 리다이렉트하는 서버 컴포넌트
// getUser()를 사용해 Supabase 서버에서 실제 토큰 유효성을 검증
// cacheComponents 모드에서는 Suspense 안에서만 동적 데이터 접근 가능
async function AuthRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }
  return null;
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      {/* 로그인 감지 후 /dashboard 리다이렉트 (Suspense로 cacheComponents 호환) */}
      <Suspense fallback={null}>
        <AuthRedirect />
      </Suspense>
      <h1 className="text-2xl font-bold">ER Scribe</h1>
      <p className="text-muted-foreground">
        응급실 의사를 위한 AI 차팅 어시스턴트
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          로그인
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          회원가입
        </Link>
      </div>
    </main>
  );
}
