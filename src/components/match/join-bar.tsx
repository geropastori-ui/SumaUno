"use client";

import { CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { joinMatch, leaveMatch } from "@/lib/actions/participation";
import type { Compatibility } from "@/lib/domain/compatibility";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button, buttonClasses } from "@/components/ui/button";

type MyStatus = "none" | "pending" | "confirmed" | "rejected" | "cancelled";

type Props = {
  matchId: string;
  myStatus: MyStatus;
  matchStatus: "open" | "full" | "closed" | "cancelled" | "finished";
  compat: Compatibility;
  summary: { title: string; when: string; venue: string; price: string };
  ageText: string;
  organizerName: string;
  /** Link wa.me al organizador (solo si estás confirmado). */
  organizerWhatsapp?: string;
};

export function JoinBar({
  matchId,
  myStatus,
  matchStatus,
  compat,
  summary,
  ageText,
  organizerName,
  organizerWhatsapp,
}: Props) {
  const [sheet, setSheet] = useState<"join" | "leave" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const firstName = organizerName.split(" ")[0];

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) setSheet(null);
      else setError(res.error ?? null);
    });
  }

  let content: React.ReactNode;

  if (myStatus === "confirmed") {
    content = (
      <div className="flex flex-col gap-2">
        <p className="animate-pop flex items-center gap-2 font-semibold text-ok">
          <CheckCircle2 className="size-5" aria-hidden /> ¡Estás adentro!
        </p>
        <div className="flex gap-2">
          {organizerWhatsapp && (
            <a
              href={organizerWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                void createClient().rpc("track_event", {
                  p_name: "whatsapp_opened",
                  p_match_id: matchId,
                  p_properties: { to: "organizer" },
                })
              }
              className={buttonClasses({ variant: "primary", block: true })}
            >
              <MessageCircle className="size-5" aria-hidden /> Escribirle a {firstName}
            </a>
          )}
          {matchStatus !== "finished" && matchStatus !== "cancelled" && (
            <Button variant="ghost" onClick={() => setSheet("leave")}>
              Bajarme
            </Button>
          )}
        </div>
      </div>
    );
  } else if (myStatus === "pending") {
    content = (
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-warn">
          <Clock className="size-5 shrink-0" aria-hidden /> Esperando que {firstName} acepte tu solicitud.
        </p>
        <Button variant="ghost" size="sm" onClick={() => setSheet("leave")}>
          Cancelar
        </Button>
      </div>
    );
  } else if (myStatus === "rejected") {
    content = <p className="text-center text-sm text-ink-soft">Esta vez no quedaste en el partido. ¡Hay más para elegir!</p>;
  } else if (matchStatus !== "open") {
    const text = {
      full: "El partido está completo. Si alguien se baja, vuelve a abrirse.",
      closed: "El organizador cerró la inscripción.",
      cancelled: "Este partido se canceló.",
      finished: "Este partido ya se jugó.",
    }[matchStatus];
    content = <p className="text-center text-sm font-semibold text-ink-soft">{text}</p>;
  } else if (!compat.canJoin) {
    content = (
      <div>
        <Button size="lg" block disabled>
          No podés anotarte
        </Button>
        <p className="mt-2 text-center text-sm text-ink-soft">Este partido busca jugadores de {ageText}.</p>
      </div>
    );
  } else {
    content = (
      <Button size="lg" variant="accent" block onClick={() => setSheet("join")}>
        {compat.needsApproval ? "Pedir lugar" : "Anotarme"}
      </Button>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-surface/95 backdrop-blur-lg">
        <div className="mx-auto max-w-lg px-5 py-3">{content}</div>
      </div>

      <BottomSheet
        open={sheet === "join"}
        onClose={() => setSheet(null)}
        title={compat.needsApproval ? "Pedir lugar" : "Confirmá tu lugar"}
        footer={
          <Button
            size="lg"
            variant="accent"
            block
            loading={pending}
            onClick={() => run(() => joinMatch(matchId))}
          >
            {compat.needsApproval ? "Enviar solicitud" : "Confirmar, me sumo"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <dl className="rounded-2xl bg-surface-2 p-4 text-sm">
            <dt className="sr-only">Partido</dt>
            <dd className="font-display text-xl font-bold uppercase">{summary.title}</dd>
            <dt className="sr-only">Cuándo</dt>
            <dd className="font-semibold">{summary.when}</dd>
            <dt className="sr-only">Dónde</dt>
            <dd className="text-ink-soft">{summary.venue}</dd>
            <dt className="sr-only">Costo</dt>
            <dd className="mt-2 font-semibold">{summary.price} por persona</dd>
          </dl>
          {compat.level === "out" && (
            <Alert tone="warn">
              <strong>Estás fuera del nivel que buscan.</strong>{" "}
              Tu solicitud va a quedar pendiente hasta que {firstName} la acepte.
            </Alert>
          )}
          {compat.level !== "out" && compat.needsApproval && (
            <p className="text-sm text-ink-soft">
              En este partido el organizador aprueba a cada jugador. Te avisamos acá cuando te acepte.
            </p>
          )}
          {!compat.needsApproval && (
            <p className="text-sm text-ink-soft">
              Quedás confirmado al instante y te pasamos el WhatsApp de {firstName} para coordinar.
            </p>
          )}
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === "leave"}
        onClose={() => setSheet(null)}
        title={myStatus === "pending" ? "Cancelar solicitud" : "¿Te bajás?"}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" block onClick={() => setSheet(null)}>
              Me quedo
            </Button>
            <Button variant="danger" block loading={pending} onClick={() => run(() => leaveMatch(matchId))}>
              {myStatus === "pending" ? "Cancelar solicitud" : "Sí, me bajo"}
            </Button>
          </div>
        }
      >
        <p className="pb-2 text-ink-soft">
          {myStatus === "pending"
            ? "Retirás tu pedido para este partido."
            : `Tu lugar se libera para otro jugador. Avisale a ${firstName} así no te espera.`}
        </p>
        {error && <Alert tone="error">{error}</Alert>}
      </BottomSheet>
    </>
  );
}
