import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";
import { Toaster } from "sonner";
import { LogoutButton } from "@/components/logout-button";
import { HeaderNewCaseButton } from "@/components/layout/header-new-case-button";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { FontSizeInit } from "@/components/font-size-init";
import { ConditionalHeader } from "@/components/layout/conditional-header";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getLayoutSettings } from "@/lib/settings/actions";
import { getServiceAccessStatus } from "@/lib/auth/service-access";
import { redirect } from "next/navigation";
import { FullscreenManager } from "@/components/pwa/fullscreen-manager";
import { AiDisclaimerModal } from "@/components/ai-disclaimer-modal";
import { ScreenGuard } from "@/components/screen-guard";

/**
 * 관리자 여부를 확인하고 NavLinks에 isAdmin을 주입하는 Server Component.
 * Suspense 내부에서 렌더링되어 non-blocking 처리됩니다.
 */
async function NavLinksWithAdmin() {
  const isAdmin = await getIsAdmin();
  return <NavLinks isAdmin={isAdmin} />;
}

/**
 * 관리자 여부를 확인하고 MobileNav에 isAdmin을 주입하는 Server Component.
 * Suspense 내부에서 렌더링되어 non-blocking 처리됩니다.
 */
async function MobileNavWithAdmin() {
  const isAdmin = await getIsAdmin();
  return <MobileNav isAdmin={isAdmin} />;
}

async function FontSizeInitWithData() {
  const { mobileFontSize } = await getLayoutSettings();
  return <FontSizeInit fontSize={mobileFontSize} />;
}

async function FullscreenManagerWithData() {
  const { fullscreenMode } = await getLayoutSettings();
  return <FullscreenManager fullscreenMode={fullscreenMode} />;
}

async function ServiceAccessGuard({ children }: { children: ReactNode }) {
  const status = await getServiceAccessStatus();
  if (status === "pending" || status === "held" || status === "denied") {
    redirect("/waiting");
  }
  return <>{children}</>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <FontSizeInitWithData />
      </Suspense>
      <Suspense fallback={null}>
        <FullscreenManagerWithData />
      </Suspense>
      <Suspense fallback={null}>
        <ConditionalHeader>
          <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Suspense fallback={<div className="size-8 lg:hidden" />}>
              <MobileNavWithAdmin />
            </Suspense>
            <Link
              href="/dashboard"
              className="ml-2 lg:ml-0"
              aria-label="규봇 홈으로 이동"
            >
              <Logo className="size-6" />
            </Link>
            <Suspense fallback={<div className="ml-8 hidden lg:flex" />}>
              <NavLinksWithAdmin />
            </Suspense>
            <div className="ml-auto flex items-center gap-2">
              {/* 모바일 환경에서만 표시되는 환자 추가 버튼 (viewMode 기반) */}
              <HeaderNewCaseButton />
              {/* 넓은 화면(1024px 이상): 로그아웃 버튼 */}
              <div className="hidden lg:block">
                <LogoutButton />
              </div>
            </div>
          </header>
        </ConditionalHeader>
      </Suspense>
      <ServiceAccessGuard>
        <main className="flex flex-1 flex-col">{children}</main>
      </ServiceAccessGuard>
      <AiDisclaimerModal />
      <Toaster />
      <ScreenGuard />
    </div>
  );
}
