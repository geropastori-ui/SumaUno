"use client";

import { AGE_CEIL, AGE_FLOOR } from "@/lib/domain/explore-filters";
import { formatAgeRange } from "@/lib/domain/levels";

type Range = { min: number | null; max: number | null };

type Props = {
  value: Range;
  onChange: (range: Range) => void;
  label?: string;
};

const thumb =
  "pointer-events-none absolute inset-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-card [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-primary";

/** Selector de rango de edad con dos manijas. Los extremos significan "sin límite". */
export function AgeRangePicker({ value, onChange, label = "Edad" }: Props) {
  const lo = value.min ?? AGE_FLOOR;
  const hi = value.max ?? AGE_CEIL;
  const pct = (n: number) => ((n - AGE_FLOOR) / (AGE_CEIL - AGE_FLOOR)) * 100;

  function set(nextLo: number, nextHi: number) {
    onChange({
      min: nextLo <= AGE_FLOOR ? null : nextLo,
      max: nextHi >= AGE_CEIL ? null : nextHi,
    });
  }

  return (
    <fieldset>
      <legend className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-ink-soft">
        {label}
      </legend>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-2xl font-bold" aria-live="polite">
          {formatAgeRange(value.min, value.max)}
        </span>
        {(value.min != null || value.max != null) && (
          <button type="button" onClick={() => onChange({ min: null, max: null })} className="text-sm font-semibold text-primary">
            Sin límite
          </button>
        )}
      </div>
      <div className="relative mt-3 h-8">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={AGE_FLOOR}
          max={AGE_CEIL}
          value={lo}
          aria-label="Edad mínima"
          aria-valuetext={value.min == null ? "Sin mínimo" : `${lo} años`}
          onChange={(e) => set(Math.min(Number(e.target.value), hi), hi)}
          className={thumb}
        />
        <input
          type="range"
          min={AGE_FLOOR}
          max={AGE_CEIL}
          value={hi}
          aria-label="Edad máxima"
          aria-valuetext={value.max == null ? "Sin máximo" : `${hi} años`}
          onChange={(e) => set(lo, Math.max(Number(e.target.value), lo))}
          className={thumb}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{AGE_FLOOR}</span>
        <span>{AGE_CEIL}+</span>
      </div>
    </fieldset>
  );
}
