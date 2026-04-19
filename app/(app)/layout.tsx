import type { ReactNode } from "react";
import Link from "next/link";
import { Toaster } from "sonner";
import { LogoutButton } from "@/components/logout-button";
import { MobileNav } from "@/components/mobile-nav";

const NAV_LINKS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/cases", label: "케이스 목록" },
  { href: "/guidelines", label: "가이드라인" },
  { href: "/settings", label: "설정" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative flex h-14 items-center border-b px-4">
        <MobileNav />
        <Link href="/dashboard" className="ml-2 text-sm font-semibold md:ml-0">
          ER Scribe
        </Link>
        <nav className="ml-6 hidden items-center gap-4 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <Toaster />
    </div>
  );
}
