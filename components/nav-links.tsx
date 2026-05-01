"use client";

import Link from "next/link";
import { Smartphone, ChevronDown, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/nav-config";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ADMIN_LINKS = [
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/resources", label: "AI 리소스" },
  { href: "/admin/error-logs", label: "에러 로그" },
] as const;

interface NavLinksProps {
  /** 관리자 여부 — true이면 관리자 드롭다운 메뉴를 표시합니다. */
  isAdmin?: boolean;
}

export function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname();
  const { viewMode, setViewMode } = useViewMode();

  const isAdminActive = ADMIN_LINKS.some(
    ({ href }) => pathname === href || pathname.startsWith(href)
  );

  return (
    <nav className="ml-8 hidden items-center gap-1 lg:flex">
      {NAV_LINKS.map(({ href, label }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}

      {/* 관리자 드롭다운 */}
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-sm outline-none transition-colors",
              isAdminActive
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="size-3.5" />
            관리자 페이지
            <ChevronDown className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ADMIN_LINKS.map(({ href, label }) => (
              <DropdownMenuItem key={href} asChild>
                <Link href={href}>{label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 모바일/PC 버전 전환 버튼 */}
      <button
        onClick={() =>
          viewMode === "mobile" ? setViewMode("auto") : setViewMode("mobile")
        }
        className={cn(
          "ml-2 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs ring-1 ring-border transition-colors hover:text-foreground",
          viewMode === "mobile"
            ? "font-medium text-foreground"
            : "text-muted-foreground"
        )}
      >
        <Smartphone className="size-3.5" />
        {viewMode === "mobile"
          ? "모바일 버전 보는 중 (취소)"
          : "모바일 버전으로 보기"}
      </button>
    </nav>
  );
}
