"use client";

import { Minus, Plus } from "lucide-react";

type StepperProps = {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
};

export function Stepper({ id, value, min, max, onChange, label }: StepperProps) {
  return (
    <div className="flex items-center gap-3" role="group" aria-labelledby={`${id}-label`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Restar ${label}`}
        className="grid size-12 place-items-center rounded-2xl border border-line bg-surface transition active:scale-90 disabled:opacity-40"
      >
        <Minus className="size-5" />
      </button>
      <output
        id={id}
        aria-live="polite"
        className="font-display w-12 text-center text-4xl font-bold tabular-nums"
      >
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Sumar ${label}`}
        className="grid size-12 place-items-center rounded-2xl border border-line bg-surface transition active:scale-90 disabled:opacity-40"
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}
