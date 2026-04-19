"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/nav-config";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="ml-8 hidden items-center gap-1 md:flex">
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
    </nav>
  );
}
