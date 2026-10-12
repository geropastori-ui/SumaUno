import { ArrowRight, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { SportBadge } from "@/components/sport-icon";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/data/session";

const steps = [
  { Icon: Users, title: "Publicá lo que te falta", text: "Un arquero, una pareja de pádel, dos para el 3x3." },
  { Icon: ShieldCheck, title: "Partidos parejos", text: "Filtrá por nivel y edad para que el juego esté bueno." },
  { Icon: MessageCircle, title: "Coordinan por WhatsApp", text: "Cuando te confirman, se pasan el contacto." },
];

export default async function Home() {
  if (await getSessionUser()) redirect("/explorar");

  return (
    <main className="pt-safe mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10">
      <header className="py-6">
        <Logo />
      </header>
      <section className="flex flex-1 flex-col justify-center">
        <div className="mb-6 flex gap-2">
          <SportBadge icon="futbol" size={52} />
          <SportBadge icon="padel" size={52} />
          <SportBadge icon="basquet" size={52} />
        </div>
        <h1 className="font-display text-6xl font-extrabold uppercase leading-[0.9] tracking-tight">
          ¿Te falta <span className="bg-accent px-1 text-accent-ink">uno</span>?
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          Publicá tu partido y completalo con jugadores de tu zona. O sumate a uno que busca gente
          como vos. Fútbol 5, pádel y básquet en Santa Fe.
        </p>
        <ul className="mt-8 flex flex-col gap-4">
          {steps.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Icon className="size-5" />
              </span>
              <span>
                <strong className="block">{title}</strong>
                <span className="text-ink-soft">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-10 flex flex-col gap-3">
        <ButtonLink href="/registro" size="lg" block>
          Crear cuenta gratis <ArrowRight className="size-5" />
        </ButtonLink>
        <ButtonLink href="/login" size="lg" variant="secondary" block>
          Ya tengo cuenta
        </ButtonLink>
      </div>
    </main>
  );
}
