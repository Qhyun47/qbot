"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type NewCaseButtonProps = Omit<ComponentProps<typeof Button>, "onClick">;

export function NewCaseButton({ children, ...props }: NewCaseButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    router.push(`/cases/new?fresh=${Date.now()}`);
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} {...props}>
      {children ?? (
        <>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isLoading ? "추가 중..." : "환자 추가"}
        </>
      )}
    </Button>
  );
}
