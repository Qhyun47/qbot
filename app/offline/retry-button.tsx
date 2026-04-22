"use client";

import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button
      onClick={() => window.location.reload()}
      variant="default"
      size="lg"
    >
      다시 시도
    </Button>
  );
}
