import { addDaysToKey, dateKeyInAR, startOfDayIso, weekdayOfKey } from "./time";

export type DayFilter = "hoy" | "manana" | "finde" | `${number}-${number}-${number}`;

export type ExploreFilters = {
  city: string | null;
  sports: string[];
  day: DayFilter | null;
  levelMin: number | null;
  levelMax: number | null;
  ageMin: number | null;
  ageMax: number | null;
  forMe: boolean;
};

/** Cookie donde se recuerda la última selección de filtros. */
export const EXPLORE_COOKIE = "sumauno_explore";

export const AGE_FLOOR = 18;
export const AGE_CEIL = 70;

export const EMPTY_FILTERS: ExploreFilters = {
  city: null,
  sports: [],
  day: null,
  levelMin: null,
  levelMax: null,
  ageMin: null,
  ageMax: null,
  forMe: false,
};

type Params = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseRange(v: string | undefined, lo: number, hi: number): [number | null, number | null] {
  if (!v) return [null, null];
  const m = /^(\d*)-(\d*)$/.exec(v);
  if (!m) return [null, null];
  const a = m[1] ? Number(m[1]) : null;
  const b = m[2] ? Number(m[2]) : null;
  const ok = (n: number | null) => n == null || (Number.isInteger(n) && n >= lo && n <= hi);
  if (!ok(a) || !ok(b) || (a != null && b != null && a > b)) return [null, null];
  return [a, b];
}

export function parseFilters(params: Params): ExploreFilters {
  const day = first(params.dia);
  const [levelMin, levelMax] = parseRange(first(params.nivel), 1, 50);
  const [ageMin, ageMax] = parseRange(first(params.edad), AGE_FLOOR, 120);
  const sports = (first(params.deporte) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]+$/.test(s));

  return {
    city: /^[a-z0-9-]+$/.test(first(params.ciudad) ?? "") ? first(params.ciudad)! : null,
    sports,
    day:
      day === "hoy" || day === "manana" || day === "finde" || /^\d{4}-\d{2}-\d{2}$/.test(day ?? "")
        ? (day as DayFilter)
        : null,
    // El nivel solo tiene sentido con un único deporte (cada uno tiene su escala).
    levelMin: sports.length === 1 ? levelMin : null,
    levelMax: sports.length === 1 ? levelMax : null,
    ageMin,
    ageMax,
    forMe: first(params.parami) === "1",
  };
}

export function hasParams(params: Params): boolean {
  return ["ciudad", "deporte", "dia", "nivel", "edad", "parami"].some((k) => params[k] !== undefined);
}

export function filtersToQuery(f: ExploreFilters): string {
  const q = new URLSearchParams();
  if (f.city) q.set("ciudad", f.city);
  if (f.forMe) q.set("parami", "1");
  if (f.sports.length) q.set("deporte", f.sports.join(","));
  if (f.day) q.set("dia", f.day);
  if (f.levelMin != null || f.levelMax != null) q.set("nivel", `${f.levelMin ?? ""}-${f.levelMax ?? ""}`);
  if (f.ageMin != null || f.ageMax != null) q.set("edad", `${f.ageMin ?? ""}-${f.ageMax ?? ""}`);
  return q.toString();
}

/** Rango de instantes [from, to) para el filtro de día, en hora argentina. */
export function dayRange(day: DayFilter | null, now: Date = new Date()): { from: string | null; to: string | null } {
  if (!day) return { from: null, to: null };
  const today = dateKeyInAR(now);
  if (day === "hoy") return { from: null, to: startOfDayIso(addDaysToKey(today, 1)) };
  if (day === "manana") {
    return { from: startOfDayIso(addDaysToKey(today, 1)), to: startOfDayIso(addDaysToKey(today, 2)) };
  }
  if (day === "finde") {
    const wd = weekdayOfKey(today); // 0 domingo … 6 sábado
    const toSaturday = wd === 0 ? -1 : 6 - wd;
    const saturday = addDaysToKey(today, toSaturday);
    return { from: wd === 0 || wd === 6 ? null : startOfDayIso(saturday), to: startOfDayIso(addDaysToKey(saturday, 2)) };
  }
  return { from: startOfDayIso(day), to: startOfDayIso(addDaysToKey(day, 1)) };
}

/** Cuántos filtros "secundarios" hay activos (para el badge del botón Filtros). */
export function activeFilterCount(f: ExploreFilters): number {
  return (
    (f.day ? 1 : 0) +
    (f.levelMin != null || f.levelMax != null ? 1 : 0) +
    (f.ageMin != null || f.ageMax != null ? 1 : 0)
  );
}
