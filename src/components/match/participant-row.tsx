"use client";

import { Gauge, MessageCircle, X } from "lucide-react";
import { useState, useTransition } from "react";
import { removeParticipant, respondToRequest } from "@/lib/actions/participation";
import type { Participant } from "@/lib/data/matches";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

type Props = {
  matchId: string;
  participant: Participant;
  isMe: boolean;
  /** Quien mira es el organizador y el partido se puede gestionar. */
  canManage: boolean;
  whatsappHref?: string;
};

export function ParticipantRow({ matchId, participant: p, isMe, canManage, whatsappHref }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const firstName = p.full_name.split(" ")[0];

  function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? null);
      else setConfirmRemove(false);
    });
  }

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <Avatar name={p.full_name} url={p.avatar_url} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {p.full_name} {isMe && <span className="text-muted">(vos)</span>}
          </p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-ink-soft">
            {p.age != null && <span>{p.age} años</span>}
            <span aria-hidden>·</span>
            <span>{p.level_name ?? "Sin nivel cargado"}</span>
            {p.out_of_level && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-warn">
                <Gauge className="size-3.5" aria-hidden /> fuera de nivel
              </span>
            )}
          </p>
        </div>
        {p.status === "confirmed" && whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escribirle a ${firstName} por WhatsApp`}
            onClick={() =>
              void createClient().rpc("track_event", {
                p_name: "whatsapp_opened",
                p_match_id: matchId,
                p_properties: { to: "player" },
              })
            }
            className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary transition active:scale-90"
          >
            <MessageCircle className="size-5" />
          </a>
        )}
        {canManage && p.status === "confirmed" && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Quitar a ${firstName}`}
            className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-surface-2"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {canManage && p.status === "pending" && (
        <div className="mt-2 flex gap-2 pl-14">
          <Button size="sm" loading={pending} onClick={() => act(() => respondToRequest(matchId, p.participant_id, true))}>
            Aceptar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => act(() => respondToRequest(matchId, p.participant_id, false))}
          >
            Rechazar
          </Button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 pl-14 text-sm text-danger">{error}</p>}

      <BottomSheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`¿Quitar a ${firstName}?`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" block onClick={() => setConfirmRemove(false)}>
              Volver
            </Button>
            <Button
              variant="danger"
              block
              loading={pending}
              onClick={() => act(() => removeParticipant(matchId, p.participant_id))}
            >
              Quitar
            </Button>
          </div>
        }
      >
        <p className="pb-2 text-ink-soft">Su lugar vuelve a quedar libre y no va a poder anotarse de nuevo en este partido.</p>
      </BottomSheet>
    </li>
  );
}
