"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button onClick={() => window.location.reload()} icon={<RotateCw className="size-4" />}>
      Reintentar
    </Button>
  );
}
