"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/nav-config";
import { useViewMode } from "@/lib/hooks/use-view-mode";

interface NavLinksProps {
  /** 관리자 여부 — true이면 "문서 관리" 메뉴를 추가로 표시합니다. */
  isAdmin?: boolean;
}

export function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname();
  const { viewMode, setViewMode } = useViewMode();

  // 관리자 전용 링크 (일반 링크 뒤에 표시)
  const adminLinks = isAdmin
    ? [
        { href: "/admin/users", label: "사용자 관리" },
        { href: "/admin/documents", label: "문서 관리" },
      ]
    : [];

  const allLinks = [...NAV_LINKS, ...adminLinks];

  return (
    <nav className="ml-8 hidden items-center gap-1 lg:flex">
      {allLinks.map(({ href, label }) => {
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

      {/* force-desktop 모드일 때만 모바일 복귀 버튼 표시 */}
      {viewMode === "desktop" && (
        <button
          onClick={() => setViewMode("auto")}
          className="ml-2 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
        >
          <Smartphone className="size-3.5" />
          모바일 버전으로 보기
        </button>
      )}
    </nav>
  );
}
