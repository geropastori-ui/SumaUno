"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChipProps = Omit<ComponentProps<"button">, "type"> & {
  selected?: boolean;
  icon?: ReactNode;
};

export function Chip({ selected, icon, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition active:scale-95",
        selected
          ? "border-ink bg-ink text-bg"
          : "border-line bg-surface text-ink-soft hover:border-ink-soft",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
