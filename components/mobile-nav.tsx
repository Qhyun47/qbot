"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Monitor, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/nav-config";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { createClient } from "@/lib/supabase/client";

interface MobileNavProps {
  /** 관리자 여부 — true이면 "문서 관리" 메뉴를 추가로 표시합니다. */
  isAdmin?: boolean;
}

export function MobileNav({ isAdmin }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useViewMode();

  // 관리자 전용 링크
  const adminLinks = isAdmin
    ? [
        { href: "/admin/users", label: "사용자 관리" },
        { href: "/admin/documents", label: "문서 관리" },
        { href: "/admin/resources", label: "AI 리소스" },
        { href: "/admin/error-logs", label: "에러 로그" },
      ]
    : [];

  const allLinks = [...NAV_LINKS, ...adminLinks];

  function handleClose() {
    setOpen(false);
  }

  function handleDesktopToggle() {
    setViewMode(viewMode === "desktop" ? "auto" : "desktop");
    handleClose();
  }

  async function handleLogout() {
    handleClose();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="메뉴 열기"
        className="size-8"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b bg-white shadow-lg dark:bg-zinc-950">
          <nav className="flex flex-col px-4 py-2">
            {allLinks.map(({ href, label }) => {
              const isActive =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={handleClose}
                  className={cn(
                    "rounded-md px-2 py-3 text-sm transition-colors",
                    isActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}

            {/* 뷰 모드 전환 버튼 */}
            <div className="my-2 border-t pt-2">
              <button
                onClick={handleDesktopToggle}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-3 text-sm transition-colors",
                  viewMode === "desktop"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Monitor className="size-4 shrink-0" />
                {viewMode === "desktop"
                  ? "PC 버전 보는 중 (취소)"
                  : "PC 버전으로 보기"}
              </button>
            </div>

            {/* 로그아웃 */}
            <div className="mb-2 border-t pt-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-2 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="size-4 shrink-0" />
                로그아웃
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
