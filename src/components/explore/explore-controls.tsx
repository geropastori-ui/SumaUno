"use client";

import { MapPin, SlidersHorizontal, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import type { City, Sport } from "@/lib/data/catalog";
import { setClientCookie } from "@/lib/client-cookie";
import { cn } from "@/lib/cn";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  EXPLORE_COOKIE,
  filtersToQuery,
  type DayFilter,
  type ExploreFilters,
} from "@/lib/domain/explore-filters";
import { createClient } from "@/lib/supabase/client";
import { AgeRangePicker } from "@/components/match/age-range-picker";
import { LevelRangePicker } from "@/components/match/level-range-picker";
import { SportIcon } from "@/components/sport-icon";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/field";

type Props = {
  filters: ExploreFilters;
  sports: Sport[];
  cities: City[];
  defaultCity: string | null;
  children: ReactNode;
};

const DAY_OPTIONS: Array<{ value: DayFilter | null; label: string }> = [
  { value: null, label: "Cualquier día" },
  { value: "hoy", label: "Hoy" },
  { value: "manana", label: "Mañana" },
  { value: "finde", label: "Finde" },
];

function track(name: "filters_applied" | "for_me_used", properties: Record<string, unknown>) {
  void createClient().rpc("track_event", { p_name: name, p_properties: properties as never });
}

export function ExploreControls({ filters, sports, cities, defaultCity, children }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheet, setSheet] = useState<"filters" | "city" | null>(null);
  const [draft, setDraft] = useState<ExploreFilters>(filters);

  const city = cities.find((c) => c.slug === filters.city);
  const draftSport = draft.sports.length === 1 ? sports.find((s) => s.slug === draft.sports[0]) : undefined;
  const count = activeFilterCount(filters);

  function apply(next: ExploreFilters) {
    const query = filtersToQuery(next);
    // Recordar la última selección (también la lee el servidor para la próxima visita).
    setClientCookie(EXPLORE_COOKIE, query, 60 * 60 * 24 * 90);
    startTransition(() => router.replace(`/explorar?${query}`, { scroll: false }));
    if (next.forMe && !filters.forMe) track("for_me_used", {});
    else track("filters_applied", { query });
  }

  function toggleSport(slug: string) {
    const sportsSel = filters.sports.includes(slug)
      ? filters.sports.filter((s) => s !== slug)
      : [...filters.sports, slug];
    const keepLevel = sportsSel.length === 1 && sportsSel[0] === filters.sports[0] && filters.sports.length === 1;
    apply({
      ...filters,
      sports: sportsSel,
      levelMin: keepLevel ? filters.levelMin : null,
      levelMax: keepLevel ? filters.levelMax : null,
    });
  }

  function openFilters() {
    setDraft(filters);
    setSheet("filters");
  }

  return (
    <>
      <div className="sticky top-0 z-20 -mt-2 bg-bg/90 pb-3 pt-2 backdrop-blur-lg">
        <div className="flex items-center gap-2 px-5">
          <button
            type="button"
            onClick={() => setSheet("city")}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-ink-soft"
          >
            <MapPin className="size-4 text-primary" aria-hidden />
            {city?.name ?? "Todas las ciudades"}
            <span className="sr-only">: cambiar ciudad</span>
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={openFilters}
            className={cn(
              "relative inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
              count ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink-soft",
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden /> Filtros
            {count > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-accent text-xs text-accent-ink">{count}</span>
            )}
          </button>
        </div>

        <div className="mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <Chip
            selected={filters.forMe}
            onClick={() => apply({ ...filters, forMe: !filters.forMe, sports: [], levelMin: null, levelMax: null, ageMin: null, ageMax: null })}
            icon={<Sparkles className="size-4" aria-hidden />}
            className={cn(filters.forMe ? "border-accent bg-accent text-accent-ink" : "")}
          >
            Para mí
          </Chip>
          <span aria-hidden className="my-2 w-px shrink-0 bg-line" />
          {sports.map((s) => (
            <Chip
              key={s.id}
              selected={filters.sports.includes(s.slug)}
              disabled={filters.forMe}
              onClick={() => toggleSport(s.slug)}
              icon={<SportIcon icon={s.icon} className="size-4" />}
              className="disabled:opacity-40"
            >
              {s.name}
            </Chip>
          ))}
        </div>
        {filters.forMe && (
          <p className="px-5 pt-1 text-sm text-ink-soft">
            Partidos de tus deportes, en tu nivel y para tu edad.
          </p>
        )}
      </div>

      <div className={cn("transition-opacity", pending && "pointer-events-none opacity-50")} aria-busy={pending}>
        {children}
      </div>

      <BottomSheet open={sheet === "city"} onClose={() => setSheet(null)} title="Ciudad">
        <div className="flex flex-col gap-2 pb-2">
          {cities.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSheet(null);
                apply({ ...filters, city: c.slug });
              }}
              className={cn(
                "flex h-14 items-center justify-between rounded-2xl border px-4 text-left font-semibold",
                c.slug === filters.city ? "border-primary bg-primary-soft" : "border-line",
              )}
            >
              {c.name}
              <span className="text-sm font-normal text-muted">{c.province}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === "filters"}
        onClose={() => setSheet(null)}
        title="Filtros"
        footer={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setDraft({ ...EMPTY_FILTERS, city: filters.city ?? defaultCity, sports: draft.sports })}
            >
              Limpiar
            </Button>
            <Button
              block
              onClick={() => {
                setSheet(null);
                apply(draft);
              }}
            >
              Ver partidos
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-7 pb-2">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-soft">Día</legend>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((o) => (
                <Chip key={o.label} selected={draft.day === o.value} onClick={() => setDraft({ ...draft, day: o.value })}>
                  {o.label}
                </Chip>
              ))}
            </div>
            <Input
              type="date"
              aria-label="Elegir una fecha"
              className="mt-3"
              value={draft.day && /^\d/.test(draft.day) ? draft.day : ""}
              onChange={(e) => setDraft({ ...draft, day: (e.target.value || null) as DayFilter | null })}
            />
          </fieldset>

          {draft.forMe ? (
            <p className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-soft">
              Con <strong>Para mí</strong> activado ya filtramos por tu nivel y tu edad.
            </p>
          ) : (
            <>
              {draftSport ? (
                <LevelRangePicker
                  label={`Nivel en ${draftSport.name}`}
                  levels={draftSport.levels}
                  value={{ min: draft.levelMin, max: draft.levelMax }}
                  onChange={({ min, max }) => setDraft({ ...draft, levelMin: min, levelMax: max })}
                />
              ) : (
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink-soft">Nivel</p>
                  <p className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-soft">
                    Cada deporte tiene su escala: elegí un solo deporte arriba para filtrar por nivel.
                  </p>
                </div>
              )}
              <AgeRangePicker
                label="Edad de los jugadores"
                value={{ min: draft.ageMin, max: draft.ageMax }}
                onChange={({ min, max }) => setDraft({ ...draft, ageMin: min, ageMax: max })}
              />
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
