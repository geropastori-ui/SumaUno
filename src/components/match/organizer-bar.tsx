"use client";

import { Ban, Lock, MoreHorizontal, Pencil, Unlock } from "lucide-react";
import type { Route } from "next";
import { useState, useTransition } from "react";
import { setMatchStatus } from "@/lib/actions/participation";
import { Alert } from "@/components/ui/alert";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button, ButtonLink } from "@/components/ui/button";
import { ShareButton } from "./share-button";

type Props = {
  matchId: string;
  matchStatus: "open" | "full" | "closed" | "cancelled" | "finished";
  shareText: string;
  confirmedCount: number;
};

export function OrganizerBar({ matchId, matchStatus, shareText, confirmedCount }: Props) {
  const [sheet, setSheet] = useState<"menu" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editable = matchStatus === "open" || matchStatus === "full" || matchStatus === "closed";

  function change(status: "open" | "closed" | "cancelled") {
    setError(null);
    startTransition(async () => {
      const res = await setMatchStatus(matchId, status);
      if (res.ok) setSheet(null);
      else setError(res.error);
    });
  }

  if (!editable) {
    return (
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-surface/95 backdrop-blur-lg">
        <p className="mx-auto max-w-lg px-5 py-4 text-center text-sm font-semibold text-ink-soft">
          {matchStatus === "cancelled" ? "Cancelaste este partido." : "Este partido ya se jugó."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-surface/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg gap-2 px-5 py-3">
          {matchStatus === "open" && (
            <div className="flex-1">
              <ShareButton matchId={matchId} text={shareText} variant="accent" label="Compartir" />
            </div>
          )}
          <ButtonLink href={`/partidos/${matchId}/editar` as Route} variant="secondary" icon={<Pencil className="size-4" />}>
            Editar
          </ButtonLink>
          <Button variant="secondary" onClick={() => setSheet("menu")} aria-label="Más opciones">
            <MoreHorizontal className="size-5" />
          </Button>
        </div>
      </div>

      <BottomSheet open={sheet === "menu"} onClose={() => setSheet(null)} title="Tu partido">
        <div className="flex flex-col gap-2 pb-2">
          {matchStatus === "closed" ? (
            <MenuItem
              icon={<Unlock className="size-5" />}
              title="Reabrir inscripción"
              text="Vuelve a aparecer en Explorar si quedan lugares."
              onClick={() => change("open")}
              disabled={pending}
            />
          ) : (
            <MenuItem
              icon={<Lock className="size-5" />}
              title="Cerrar inscripción"
              text="Ya completaste por otro lado: deja de aparecer en Explorar."
              onClick={() => change("closed")}
              disabled={pending}
            />
          )}
          <MenuItem
            icon={<Ban className="size-5" />}
            title="Cancelar partido"
            text="Se avisa en el detalle a quienes estaban anotados."
            onClick={() => setSheet("cancel")}
            danger
          />
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === "cancel"}
        onClose={() => setSheet(null)}
        title="¿Cancelar el partido?"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" block onClick={() => setSheet(null)}>
              No, volver
            </Button>
            <Button variant="danger" block loading={pending} onClick={() => change("cancelled")}>
              Sí, cancelar
            </Button>
          </div>
        }
      >
        <p className="pb-2 text-ink-soft">
          {confirmedCount > 0
            ? `Hay ${confirmedCount} jugador${confirmedCount > 1 ? "es" : ""} confirmado${confirmedCount > 1 ? "s" : ""}. Escribiles por WhatsApp para avisarles. No se puede deshacer.`
            : "El partido deja de estar visible. No se puede deshacer."}
        </p>
        {error && <Alert tone="error">{error}</Alert>}
      </BottomSheet>
    </>
  );
}

function MenuItem({
  icon,
  title,
  text,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-surface-2 disabled:opacity-50"
    >
      <span className={danger ? "text-danger" : "text-ink-soft"}>{icon}</span>
      <span>
        <span className={danger ? "block font-semibold text-danger" : "block font-semibold"}>{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}
