"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      icon={<TriangleAlert className="size-8" />}
      title="Se nos cayó la pelota"
      action={
        <Button onClick={reset} icon={<RotateCw className="size-4" />}>
          Probar de nuevo
        </Button>
      }
    >
      Algo falló al cargar esta pantalla. Si sigue pasando, revisá tu conexión.
    </EmptyState>
  );
}
