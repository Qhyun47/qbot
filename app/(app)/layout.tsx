import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Toaster } from "sonner";
import { LogoutButton } from "@/components/logout-button";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Suspense fallback={<div className="size-8 md:hidden" />}>
          <MobileNav />
        </Suspense>
        <Link
          href="/dashboard"
          className="ml-2 text-sm font-bold tracking-tight md:ml-0"
        >
          ER Scribe
        </Link>
        <Suspense fallback={<div className="ml-8 hidden md:flex" />}>
          <NavLinks />
        </Suspense>
        <div className="ml-auto">
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <Toaster />
    </div>
  );
}
