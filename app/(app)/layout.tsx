// ER Scribe 앱 전용 공통 레이아웃
// TODO: Task 004 — AppNavbar 컴포넌트로 헤더 교체

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  // 미들웨어(proxy.ts)가 1차 방어선이나, 레이아웃에서도 인증 상태를 검증 (심층 방어)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b px-4">
        {/* TODO: Task 004 — 공통 네비바 컴포넌트로 교체 */}
        <span className="text-sm font-semibold">ER Scribe</span>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
