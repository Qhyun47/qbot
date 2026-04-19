"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/cases", label: "케이스 목록" },
  { href: "/guidelines", label: "가이드라인" },
  { href: "/settings", label: "설정" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="메뉴 열기"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b bg-background shadow-md">
          <nav className="flex flex-col p-4">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="border-b py-3 text-sm font-medium text-muted-foreground transition-colors last:border-b-0 hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
