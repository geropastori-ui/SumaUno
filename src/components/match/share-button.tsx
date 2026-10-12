"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ShareButton({
  matchId,
  text,
  variant = "secondary",
  label = "Compartir",
}: {
  matchId: string;
  text: string;
  variant?: "secondary" | "accent" | "primary";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/partidos/${matchId}`;
    void createClient().rpc("track_event", { p_name: "match_shared", p_match_id: matchId });
    if (navigator.share) {
      try {
        await navigator.share({ title: "SumáUno", text, url });
        return;
      } catch {
        // El usuario cerró el diálogo: no hacemos nada.
        return;
      }
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant={variant}
      onClick={share}
      icon={copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
    >
      {copied ? "¡Link copiado!" : label}
    </Button>
  );
}
