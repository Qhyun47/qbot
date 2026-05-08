"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CurrentUser } from "@/lib/auth/get-current-user";

function getInitials(user: CurrentUser): string {
  if (user.fullName) {
    return user.fullName.charAt(0).toUpperCase();
  }
  return (user.email.split("@")[0] ?? "?").charAt(0).toUpperCase();
}

function getDisplayName(user: CurrentUser): string {
  if (user.fullName) return user.fullName;
  return user.email.split("@")[0] ?? user.email;
}

interface UserAccountButtonProps {
  user: CurrentUser;
}

export function UserAccountButton({ user }: UserAccountButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const logout = () => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    });
  };

  const initials = getInitials(user);
  const displayName = getDisplayName(user);

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="계정 메뉴"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{user.email}</TooltipContent>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-semibold">{displayName}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 size-4" />
              )}
              {isPending ? "로그아웃 중..." : "로그아웃"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
