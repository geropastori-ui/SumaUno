"use client";

import type { SportLevel } from "@/lib/domain/levels";
import { formatLevelRange } from "@/lib/domain/levels";
import { cn } from "@/lib/cn";

type Range = { min: number | null; max: number | null };

type Props = {
  levels: SportLevel[];
  value: Range;
  onChange: (range: Range) => void;
  label?: string;
};

/**
 * Rango de nivel con chips: tocá el nivel más bajo y el más alto que buscás.
 * Tocar un nivel fuera del rango lo extiende; tocar uno de adentro empieza de nuevo desde ahí.
 */
export function LevelRangePicker({ levels, value, onChange, label = "Nivel buscado" }: Props) {
  const { min, max } = value;
  const isAll = min == null && max == null;

  function tap(rank: number) {
    if (min == null || max == null) return onChange({ min: rank, max: rank });
    if (min === rank && max === rank) return onChange({ min: null, max: null });
    if (rank < min) return onChange({ min: rank, max });
    if (rank > max) return onChange({ min, max: rank });
    return onChange({ min: rank, max: rank });
  }

  const compact = levels.length > 4;

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink-soft">{label}</legend>
      <div className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-3")}>
        {levels.map((l) => {
          const inRange = min != null && max != null && l.rank >= min && l.rank <= max;
          const isEdge = l.rank === min || l.rank === max;
          return (
            <button
              key={l.rank}
              type="button"
              aria-pressed={inRange}
              onClick={() => tap(l.rank)}
              className={cn(
                "h-11 rounded-xl border px-1 text-sm font-semibold transition active:scale-95",
                compact && "font-display text-lg",
                inRange
                  ? isEdge
                    ? "border-primary bg-primary text-primary-ink"
                    : "border-primary bg-primary-soft text-primary"
                  : "border-line bg-surface text-ink-soft",
              )}
            >
              {l.name}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-ink" aria-live="polite">
          {formatLevelRange(levels, min, max)}
        </span>
        {isAll ? (
          <span className="text-muted">Tocá el mínimo y el máximo</span>
        ) : (
          <button
            type="button"
            onClick={() => onChange({ min: null, max: null })}
            className="font-semibold text-primary"
          >
            Todos los niveles
          </button>
        )}
      </div>
    </fieldset>
  );
}
