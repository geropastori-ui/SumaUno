import { CalendarSearch, Plus } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ExploreControls } from "@/components/explore/explore-controls";
import { MatchCard } from "@/components/match/match-card";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCities, getSports } from "@/lib/data/catalog";
import { searchMatches, type MatchListItem } from "@/lib/data/matches";
import { getMyProfile } from "@/lib/data/profile";
import { formatDayLabel } from "@/lib/domain/dates";
import { EXPLORE_COOKIE, hasParams, parseFilters } from "@/lib/domain/explore-filters";

export const metadata: Metadata = { title: "Explorar" };

function groupByDay(matches: MatchListItem[]) {
  const groups = new Map<string, MatchListItem[]>();
  for (const m of matches) {
    const label = formatDayLabel(m.starts_at);
    groups.set(label, [...(groups.get(label) ?? []), m]);
  }
  return [...groups.entries()];
}

export default async function ExplorePage({ searchParams }: PageProps<"/explorar">) {
  const [profile, sports, cities, params, cookieStore] = await Promise.all([
    getMyProfile(),
    getSports(),
    getCities(),
    searchParams,
    cookies(),
  ]);
  if (!profile) return null;

  // Sin parámetros en la URL, se recupera la última selección guardada.
  const saved = cookieStore.get(EXPLORE_COOKIE)?.value;
  const source = hasParams(params) || saved === undefined ? params : Object.fromEntries(new URLSearchParams(saved));
  const filters = parseFilters(source);
  const myCity = cities.find((c) => c.id === profile.cityId)?.slug ?? null;
  if (!filters.city) filters.city = myCity;

  const cityId = cities.find((c) => c.slug === filters.city)?.id ?? null;
  const sportIds = filters.sports
    .map((slug) => sports.find((s) => s.slug === slug)?.id)
    .filter((id): id is string => Boolean(id));

  const matches = await searchMatches({
    cityId,
    sportIds,
    day: filters.day,
    levelMin: filters.levelMin,
    levelMax: filters.levelMax,
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    forMe: filters.forMe,
  });
  const groups = groupByDay(matches);
  const filtered = filters.forMe || filters.sports.length > 0 || filters.day || filters.levelMin != null ||
    filters.levelMax != null || filters.ageMin != null || filters.ageMax != null;

  return (
    <>
      <PageHeader title="Explorar" subtitle="Partidos que buscan jugadores." />
      <ExploreControls filters={filters} sports={sports} cities={cities} defaultCity={myCity}>
        {groups.length === 0 ? (
          <EmptyState
            icon={<CalendarSearch className="size-8" />}
            title={filters.forMe ? "Nada para vos (todavía)" : "Por ahora, nada"}
            action={
              <ButtonLink href="/publicar" variant="accent" icon={<Plus className="size-5" />}>
                Publicar un partido
              </ButtonLink>
            }
          >
            {filtered
              ? "No hay partidos abiertos con estos filtros. Probá ampliarlos o armá vos el partido."
              : "No hay partidos abiertos en esta ciudad. ¿Te animás a publicar el primero?"}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-6 px-5">
            {groups.map(([label, items]) => (
              <section key={label} aria-labelledby={`day-${label}`}>
                <h2 id={`day-${label}`} className="font-display mb-2 text-lg font-bold uppercase tracking-wide text-muted">
                  {label}
                </h2>
                <ul className="flex flex-col gap-3">
                  {items.map((m) => (
                    <li key={m.id}>
                      <MatchCard match={m} me={profile} sport={sports.find((s) => s.id === m.sport_id)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </ExploreControls>
    </>
  );
}
