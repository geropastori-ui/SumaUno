import { MapPinOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <Logo />
      <div className="mt-10 grid size-16 place-items-center rounded-3xl bg-accent text-accent-ink">
        <MapPinOff className="size-8" />
      </div>
      <h1 className="font-display mt-4 text-3xl font-extrabold uppercase">Pelota afuera</h1>
      <p className="mt-2 text-ink-soft">Esta página no existe o se movió.</p>
      <div className="mt-6">
        <ButtonLink href="/explorar">Ir a Explorar</ButtonLink>
      </div>
    </main>
  );
}
