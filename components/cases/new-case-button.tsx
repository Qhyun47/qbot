"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewCaseSetupDialog } from "@/components/cases/new-case-setup-dialog";
import type { ComponentProps } from "react";

type NewCaseButtonProps = Omit<ComponentProps<typeof Button>, "onClick">;

export function NewCaseButton({ children, ...props }: NewCaseButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} {...props}>
        {children ?? (
          <>
            <Plus className="size-4" />
            환자 추가
          </>
        )}
      </Button>
      {dialogOpen && (
        <NewCaseSetupDialog onClose={() => setDialogOpen(false)} />
      )}
    </>
  );
}
