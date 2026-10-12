import { Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = { icon: string; className?: string };

/** Íconos propios por deporte (lucide no tiene pádel). Clave = sports.icon en la base. */
export function SportIcon({ icon, className }: Props) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("size-5", className),
    "aria-hidden": true,
  };

  switch (icon) {
    case "futbol":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5l3.6 2.6-1.4 4.2H9.8L8.4 10.1z" />
          <path d="M12 7.5V3.2M15.6 10.1l4.1-1.4M14.2 14.3l2.6 3.6M9.8 14.3l-2.6 3.6M8.4 10.1L4.3 8.7" />
        </svg>
      );
    case "padel":
      return (
        <svg {...common}>
          <path d="M14.5 3.5a6 6 0 0 1 6 6c0 3.6-3.4 6.5-6.5 6.5-1 0-1.8-.2-2.6-.7L6.6 20.1a1.6 1.6 0 0 1-2.3 0l-.4-.4a1.6 1.6 0 0 1 0-2.3l4.8-4.8a5.6 5.6 0 0 1-.7-2.6c0-3.1 2.9-6.5 6.5-6.5z" />
          <circle cx="12.5" cy="8.5" r=".6" fill="currentColor" />
          <circle cx="15.5" cy="8.5" r=".6" fill="currentColor" />
          <circle cx="14" cy="11.5" r=".6" fill="currentColor" />
          <circle cx="17" cy="11.5" r=".6" fill="currentColor" />
        </svg>
      );
    case "basquet":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3v18" />
          <path d="M5.6 5.6a9 9 0 0 1 0 12.8M18.4 5.6a9 9 0 0 0 0 12.8" />
        </svg>
      );
    default:
      return <Trophy className={cn("size-5", className)} aria-hidden />;
  }
}

const sportColors: Record<string, string> = {
  futbol: "bg-sport-futbol",
  padel: "bg-sport-padel",
  basquet: "bg-sport-basquet",
};

const sportText: Record<string, string> = {
  futbol: "text-sport-futbol",
  padel: "text-sport-padel",
  basquet: "text-sport-basquet",
};

export function sportBg(icon: string) {
  return sportColors[icon] ?? "bg-primary";
}

export function sportTextClass(icon: string) {
  return sportText[icon] ?? "text-primary";
}

export function SportBadge({ icon, size = 44 }: { icon: string; size?: number }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-2xl text-white", sportBg(icon))}
      style={{ width: size, height: size }}
    >
      <SportIcon icon={icon} className="size-[55%]" />
    </span>
  );
}
