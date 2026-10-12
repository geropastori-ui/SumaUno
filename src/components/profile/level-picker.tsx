"use client";

import { useId } from "react";
import type { SportLevel } from "@/lib/domain/levels";
import { cn } from "@/lib/cn";

type Props = {
  name: string;
  levels: SportLevel[];
  value: number | null;
  onChange: (rank: number) => void;
};

/**
 * Selector de nivel con una explicación corta por opción, para que cada uno se ubique bien.
 * Escalas cortas (fútbol, básquet): tarjetas. Escalas largas (pádel): chips + descripción.
 */
export function LevelPicker({ name, levels, value, onChange }: Props) {
  const groupId = useId();
  const selected = levels.find((l) => l.rank === value);

  if (levels.length <= 4) {
    return (
      <div role="radiogroup" aria-label={`Tu nivel en ${name}`} className="mt-4 flex flex-col gap-2">
        {levels.map((level) => {
          const active = level.rank === value;
          return (
            <button
              key={level.rank}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(level.rank)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]",
                active ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-line hover:border-ink-soft",
              )}
            >
              <span className="block font-semibold">{level.name}</span>
              <span className="block text-sm text-ink-soft">{level.description}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div role="radiogroup" aria-label={`Tu categoría en ${name}`} className="grid grid-cols-4 gap-2">
        {levels.map((level) => {
          const active = level.rank === value;
          return (
            <button
              key={level.rank}
              type="button"
              role="radio"
              aria-checked={active}
              aria-describedby={active ? `${groupId}-desc` : undefined}
              onClick={() => onChange(level.rank)}
              className={cn(
                "font-display h-11 rounded-xl border text-lg font-bold transition active:scale-95",
                active ? "border-primary bg-primary text-primary-ink" : "border-line hover:border-ink-soft",
              )}
            >
              {level.name}
            </button>
          );
        })}
      </div>
      <p id={`${groupId}-desc`} aria-live="polite" className="mt-3 min-h-10 text-sm text-ink-soft">
        {selected ? (
          <>
            <strong className="text-ink">{selected.name}:</strong> {selected.description}
          </>
        ) : (
          "Elegí tu categoría. Si dudás entre dos, quedate con la más baja."
        )}
      </p>
    </div>
  );
}
