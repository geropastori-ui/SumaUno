"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Refresca el detalle cuando cambia el partido o sus inscripciones (Supabase Realtime). */
export function MatchLive({ matchId }: { matchId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 300);
    };

    // Realtime aplica RLS con el token del usuario: hay que cargarlo antes de suscribirse.
    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel(`match:${matchId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, refresh)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "match_participants", filter: `match_id=eq.${matchId}` },
          refresh,
        )
        .subscribe();
    });
    void supabase.rpc("track_event", { p_name: "match_viewed", p_match_id: matchId });

    // Al volver a la app (celular bloqueado, otra pestaña) se pudieron perder eventos.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [matchId, router]);

  return null;
}
