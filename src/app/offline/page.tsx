import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <Logo />
      <div className="mt-10 grid size-16 place-items-center rounded-3xl bg-accent text-accent-ink">
        <WifiOff className="size-8" />
      </div>
      <h1 className="font-display mt-4 text-3xl font-extrabold uppercase">Te quedaste sin señal</h1>
      <p className="mt-2 text-ink-soft">
        Para ver y anotarte en partidos necesitás conexión. Apenas vuelva, seguimos.
      </p>
      <div className="mt-6">
        <RetryButton />
      </div>
    </main>
  );
}
