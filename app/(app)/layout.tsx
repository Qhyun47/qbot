import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import { LogoutButton } from "@/components/logout-button";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { ViewModeInit } from "@/components/view-mode-init";
import { FontSizeInit } from "@/components/font-size-init";
import { ConditionalHeader } from "@/components/layout/conditional-header";
import { getIsAdmin } from "@/lib/auth/is-admin";
import { getLayoutSettings } from "@/lib/settings/actions";

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

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ViewModeInit />
      <Suspense fallback={null}>
        <FontSizeInitWithData />
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
              <Image
                src="/icons/icon-transparent.png"
                alt="규봇"
                width={32}
                height={32}
                className="dark:invert"
                priority
              />
            </Link>
            <Suspense fallback={<div className="ml-8 hidden lg:flex" />}>
              <NavLinksWithAdmin />
            </Suspense>
            <div className="ml-auto">
              <LogoutButton />
            </div>
          </header>
        </ConditionalHeader>
      </Suspense>
      <main className="flex flex-1 flex-col">{children}</main>
      <Toaster />
    </div>
  );
}
