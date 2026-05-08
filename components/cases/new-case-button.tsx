"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
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
      {dialogOpen &&
        createPortal(
          <NewCaseSetupDialog onClose={() => setDialogOpen(false)} />,
          document.body
        )}
    </>
  );
}
