"use client";

import { useState } from "react";
import { Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MedicationOrganizerDialog } from "@/components/medication/medication-organizer-dialog";

interface MedicationTriggerButtonProps {
  caseId?: string;
  defaultPastHx?: string;
  currentHistory?: string;
}

export function MedicationTriggerButton({
  caseId,
  defaultPastHx,
  currentHistory,
}: MedicationTriggerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="inline-flex gap-1.5"
            >
              <Pill className="size-3.5" />
              <span className="hidden xl:inline">의약품 정리</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="xl:hidden">의약품 정리</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <MedicationOrganizerDialog
        open={open}
        onOpenChange={setOpen}
        caseId={caseId}
        defaultPastHx={defaultPastHx}
        currentHistory={currentHistory}
      />
    </>
  );
}
