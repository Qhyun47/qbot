import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { Logo } from "@/components/icons/logo";

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <Suspense fallback={null}>
        <AuthRedirect />
      </Suspense>

      {/* 로고 + 타이틀 */}
      <div className="flex flex-col items-center gap-3">
        <Logo className="size-16" />
        <div className="text-center">
          <h1 className="text-2xl font-bold">규봇</h1>
        </div>
      </div>

      {/* 앱 설치 — 주 CTA */}
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <p className="text-center text-sm text-muted-foreground">
          홈 화면에 설치하면 앱처럼 빠르게 실행할 수 있습니다
        </p>
        <PwaInstallButton
          buttonSize="default"
          buttonVariant="default"
          className="w-full"
        />
      </div>

      {/* 로그인 / 회원가입 — 부 링크 */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground">이미 설치하셨나요?</p>
        <div className="flex gap-4">
          <Link
            href="/auth/login"
            className="text-sm underline underline-offset-4"
          >
            로그인
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm underline underline-offset-4"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}
