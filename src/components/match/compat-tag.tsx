import { Check, Gauge, Hourglass } from "lucide-react";
import type { Compatibility } from "@/lib/domain/compatibility";
import { cn } from "@/lib/cn";

const styles = {
  Encajás: { cls: "bg-ok-soft text-ok", Icon: Check },
  "Fuera de tu nivel": { cls: "bg-warn-soft text-warn", Icon: Gauge },
  "Fuera de tu edad": { cls: "bg-danger-soft text-danger", Icon: Hourglass },
} as const;

export function CompatTag({ compat, className }: { compat: Compatibility; className?: string }) {
  const { cls, Icon } = styles[compat.label];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", cls, className)}>
      <Icon className="size-3.5" strokeWidth={3} aria-hidden />
      {compat.label}
    </span>
  );
}
