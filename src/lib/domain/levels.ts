export type SportLevel = {
  rank: number;
  name: string;
  description: string;
};

export function levelName(levels: SportLevel[], rank: number | null | undefined) {
  if (rank == null) return null;
  return levels.find((l) => l.rank === rank)?.name ?? null;
}

/** "Intermedio a Avanzado", "Desde 6ta", "Hasta Intermedio", "Todos los niveles". */
export function formatLevelRange(
  levels: SportLevel[],
  min: number | null,
  max: number | null,
): string {
  const lo = levelName(levels, min);
  const hi = levelName(levels, max);
  const lowest = levels.length ? Math.min(...levels.map((l) => l.rank)) : null;
  const highest = levels.length ? Math.max(...levels.map((l) => l.rank)) : null;
  const fromBottom = min == null || min === lowest;
  const toTop = max == null || max === highest;

  if (fromBottom && toTop) return "Todos los niveles";
  if (lo && hi && min === max) return lo;
  if (fromBottom && hi) return `Hasta ${hi}`;
  if (toTop && lo) return `Desde ${lo}`;
  return `${lo} a ${hi}`;
}

export function formatAgeRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Todas las edades";
  if (min != null && max != null) return min === max ? `${min} años` : `${min} a ${max} años`;
  if (min != null) return `+${min} años`;
  return `Hasta ${max} años`;
}
