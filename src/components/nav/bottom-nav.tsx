"use client";

import { CalendarCheck2, Compass, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/explorar", label: "Explorar", Icon: Compass },
  { href: "/publicar", label: "Publicar", Icon: Plus, primary: true },
  { href: "/mis-partidos", label: "Mis partidos", Icon: CalendarCheck2 },
  { href: "/perfil", label: "Perfil", Icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-lg"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {items.map(({ href, label, Icon, ...rest }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const primary = "primary" in rest;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition",
                  active ? "text-ink" : "text-muted hover:text-ink-soft",
                )}
              >
                {primary ? (
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-2xl bg-accent text-accent-ink shadow-card transition active:scale-90",
                      active && "ring-2 ring-ink",
                    )}
                  >
                    <Icon className="size-6" strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon className={cn("size-6 transition", active && "scale-110")} strokeWidth={active ? 2.4 : 1.9} />
                )}
                <span className={primary ? "sr-only" : undefined}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
