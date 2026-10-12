"use client";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

/** Vuelve a la pantalla anterior si venís de la app; si entraste por un link, va al fallback. */
export function BackLink({ fallback, label = "Volver" }: { fallback: Route; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        const cameFromApp = document.referrer.startsWith(window.location.origin) && window.history.length > 1;
        if (cameFromApp) router.back();
        else router.push(fallback);
      }}
      className="inline-flex h-10 items-center gap-1 text-sm font-semibold text-ink-soft"
    >
      <ArrowLeft className="size-4" aria-hidden /> {label}
    </button>
  );
}
