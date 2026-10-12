import { CalendarHeart, Clock, Compass, Crown, History, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MatchCard } from "@/components/match/match-card";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { getSports } from "@/lib/data/catalog";
import { getMyMatches, isUpcoming, type MyMatchItem } from "@/lib/data/matches";
import { getMyProfile } from "@/lib/data/profile";

export const metadata: Metadata = { title: "Mis partidos" };

function Badge({ item }: { item: MyMatchItem }) {
  if (item.role === "organizer") {
    if (item.pendingRequests > 0 && isUpcoming(item)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-bold text-warn">
          {item.pendingRequests} solicitud{item.pendingRequests > 1 ? "es" : ""}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-ink">
        <Crown className="size-3.5" aria-hidden /> Organizás
      </span>
    );
  }
  if (item.myStatus === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-bold text-warn">
        <Clock className="size-3.5" aria-hidden /> Pendiente
      </span>
    );
  }
  return <span className="rounded-full bg-ok-soft px-2.5 py-1 text-xs font-bold text-ok">Confirmado</span>;
}

export default async function MyMatchesPage({ searchParams }: PageProps<"/mis-partidos">) {
  const [profile, sports, { tab }] = await Promise.all([getMyProfile(), getSports(), searchParams]);
  if (!profile) return null;
  const history = tab === "historial";
  const all = await getMyMatches(profile.id);
  const items = history
    ? all.filter((m) => !isUpcoming(m)).reverse()
    : all.filter((m) => isUpcoming(m));

  return (
    <>
      <PageHeader title="Mis partidos" />
      <div className="px-5">
        <nav aria-label="Ver" className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
          {[
            { href: "/mis-partidos", label: "Próximos", active: !history },
            { href: "/mis-partidos?tab=historial", label: "Historial", active: history },
          ].map((t) => (
            <Link
              key={t.label}
              href={t.href as "/mis-partidos"}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition",
                t.active ? "bg-surface text-ink shadow-card" : "text-muted",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {items.length === 0 ? (
          history ? (
            <EmptyState icon={<History className="size-8" />} title="Sin historial todavía">
              Acá van a quedar los partidos que jugaste y organizaste.
            </EmptyState>
          ) : (
            <EmptyState
              icon={<CalendarHeart className="size-8" />}
              title="Agenda libre"
              action={
                <div className="flex flex-col gap-2">
                  <ButtonLink href="/explorar" icon={<Compass className="size-5" />}>
                    Buscar un partido
                  </ButtonLink>
                  <ButtonLink href="/publicar" variant="secondary" icon={<Plus className="size-5" />}>
                    Publicar el mío
                  </ButtonLink>
                </div>
              }
            >
              No tenés partidos en los próximos días. Sumate a uno o armá el tuyo.
            </EmptyState>
          )
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((m) => (
              <li key={`${m.role}-${m.id}`}>
                <MatchCard
                  match={m}
                  me={profile}
                  sport={sports.find((s) => s.id === m.sport_id)}
                  badge={<Badge item={m} />}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
