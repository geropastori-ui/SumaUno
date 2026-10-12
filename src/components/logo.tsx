import { cn } from "@/lib/cn";

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "font-display inline-flex items-center gap-1.5 font-extrabold uppercase italic tracking-tight",
        size === "lg" ? "text-5xl" : "text-2xl",
        className,
      )}
    >
      Sumá<span className="text-primary">Uno</span>
      <span
        aria-hidden
        className={cn(
          "not-italic rounded-lg bg-accent px-1.5 leading-tight text-accent-ink",
          size === "lg" ? "text-3xl" : "text-base",
        )}
      >
        +1
      </span>
    </span>
  );
}
