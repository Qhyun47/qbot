"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Monitor,
  LogOut,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/nav-config";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { createClient } from "@/lib/supabase/client";

const ADMIN_LINKS = [
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/resources", label: "AI 리소스" },
  { href: "/admin/error-logs", label: "에러 로그" },
] as const;

interface MobileNavProps {
  /** 관리자 여부 — true이면 관리자 서브메뉴를 표시합니다. */
  isAdmin?: boolean;
}

export function MobileNav({ isAdmin }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  // data-view="desktop" 여부: auto 모드에서 PC 기기로 판정된 경우 true
  const [actuallyDesktop, setActuallyDesktop] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useViewMode();

  useEffect(() => {
    const check = () =>
      setActuallyDesktop(
        document.documentElement.getAttribute("data-view") === "desktop"
      );
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-view"],
    });
    return () => obs.disconnect();
  }, [viewMode]);

  function handleClose() {
    setOpen(false);
    setAdminOpen(false);
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

  const isAdminActive = ADMIN_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(href)
  );

  return (
    <div className="xl:hidden">
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
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div className="absolute left-0 right-0 top-14 z-50 border-b bg-white shadow-lg dark:bg-zinc-950">
            <nav className="flex flex-col px-4 py-2">
              {NAV_LINKS.map(({ href, label }) => {
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

              {/* 관리자 서브메뉴 */}
              {isAdmin && (
                <div className="mt-1 border-t pt-1">
                  <button
                    onClick={() => setAdminOpen((prev) => !prev)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-3 text-sm transition-colors",
                      isAdminActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-expanded={adminOpen}
                  >
                    <Shield className="size-4 shrink-0" />
                    관리자 페이지
                    {adminOpen ? (
                      <ChevronDown className="ml-auto size-4 shrink-0" />
                    ) : (
                      <ChevronRight className="ml-auto size-4 shrink-0" />
                    )}
                  </button>

                  {adminOpen && (
                    <div className="ml-6 flex flex-col pb-1">
                      {ADMIN_LINKS.map(({ href, label }) => {
                        const isActive =
                          pathname === href || pathname.startsWith(href);
                        return (
                          <Link
                            key={href}
                            href={href}
                            onClick={handleClose}
                            className={cn(
                              "rounded-md px-2 py-2.5 text-sm transition-colors",
                              isActive
                                ? "font-medium text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 뷰 모드 전환 버튼
                - auto + PC 기기: data-view="desktop"이 자동으로 설정되어 있으므로 버튼 불필요
                - auto + 모바일 기기: "PC 버전으로 보기" 표시
                - 명시적 desktop 모드: "PC 버전 보는 중 (취소)" 표시 */}
              {!(actuallyDesktop && viewMode === "auto") && (
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
              )}

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
        </>
      )}
    </div>
  );
}
