import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function MatchNotFound() {
  return (
    <EmptyState
      icon={<SearchX className="size-8" />}
      title="Partido no encontrado"
      action={<ButtonLink href="/explorar">Ver otros partidos</ButtonLink>}
    >
      Puede que lo hayan cancelado o que el link esté mal.
    </EmptyState>
  );
}
