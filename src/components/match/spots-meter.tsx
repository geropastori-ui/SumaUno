import { cn } from "@/lib/cn";

/** Puntitos: lugares ya cubiertos vs. los que siguen libres. */
export function SpotsMeter({ needed, left, className }: { needed: number; left: number; className?: string }) {
  const taken = needed - left;
  if (needed > 12) return null;
  return (
    <span className={cn("flex gap-1", className)} aria-hidden>
      {Array.from({ length: needed }, (_, i) => (
        <span
          key={i}
          className={cn("size-2.5 rounded-full", i < taken ? "bg-primary" : "border-2 border-primary/60")}
        />
      ))}
    </span>
  );
}
