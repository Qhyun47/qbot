"use client";

import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const logout = () => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    });
  };

  return (
    <Button onClick={logout} disabled={isPending}>
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {isPending ? "로그아웃 중..." : "Logout"}
    </Button>
  );
}
