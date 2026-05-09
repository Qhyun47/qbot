import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <>
      {/* 라이트 모드: 투명 배경 + 어두운 선 원본 PNG */}
      <img
        src="/icons/icon-transparent.png"
        alt="규봇"
        className={cn("dark:hidden", className)}
      />
      {/* 다크 모드: 투명 배경 + 흰색·빨간색 선 (icon.svg에서 배경 제거) */}
      <img
        src="/icons/icon-header-dark.svg"
        alt="규봇"
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}
