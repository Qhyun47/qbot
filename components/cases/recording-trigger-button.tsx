"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RecordingSheet } from "@/components/cases/recording-sheet";

interface RecordingTriggerButtonProps {
  caseId: string;
  size?: "default" | "sm";
}

export function RecordingTriggerButton({
  caseId,
  size = "default",
}: RecordingTriggerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={size}
              onClick={() => setOpen(true)}
              className="inline-flex gap-1.5"
            >
              <Mic className="size-3.5" />
              <span className="hidden lg:inline">녹음</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="lg:hidden">녹음</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <RecordingSheet open={open} onOpenChange={setOpen} caseId={caseId} />
    </>
  );
}
