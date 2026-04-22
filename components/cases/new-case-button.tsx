"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type NewCaseButtonProps = Omit<ComponentProps<typeof Button>, "onClick">;

export function NewCaseButton({ children, ...props }: NewCaseButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/cases/new?fresh=${Date.now()}`);
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children ?? (
        <>
          <Plus className="size-4" />
          환자 추가
        </>
      )}
    </Button>
  );
}
