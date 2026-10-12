import { MapPin } from "lucide-react";
import Link from "next/link";
import type { Sport } from "@/lib/data/catalog";
import type { MatchListItem } from "@/lib/data/matches";
import type { MyProfile } from "@/lib/data/profile";
import { evaluateCompatibility } from "@/lib/domain/compatibility";
import { formatMatchWhen } from "@/lib/domain/dates";
import { formatAgeRange, formatLevelRange } from "@/lib/domain/levels";
import { formatPrice } from "@/lib/domain/money";
import { cn } from "@/lib/cn";
import { SportBadge } from "@/components/sport-icon";
import { Avatar } from "@/components/ui/avatar";
import { CompatTag } from "./compat-tag";
import { SpotsMeter } from "./spots-meter";

type Props = {
  match: MatchListItem;
  sport: Sport | undefined;
  me: Pick<MyProfile, "id" | "age" | "levels">;
  /** Etiqueta de estado propia (Mis partidos), en lugar de la compatibilidad. */
  badge?: React.ReactNode;
};

export function MatchCard({ match, sport, me, badge }: Props) {
  const levels = sport?.levels ?? [];
  const isMine = match.organizer_id === me.id;
  const compat = evaluateCompatibility(
    {
      sportId: match.sport_id,
      levelMin: match.level_min,
      levelMax: match.level_max,
      ageMin: match.age_min,
      ageMax: match.age_max,
      acceptanceMode: match.acceptance_mode,
    },
    { age: me.age, levels: me.levels },
  );
  const open = match.status === "open";

  return (
    <Link
      href={`/partidos/${match.id}`}
      className="group block rounded-3xl bg-surface p-4 shadow-card transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <SportBadge icon={match.sport.icon} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{match.sport.name}</p>
          <p className="font-display text-2xl font-bold uppercase leading-tight">{formatMatchWhen(match.starts_at)}</p>
        </div>
        {open ? (
          <div className="flex flex-col items-end gap-1.5">
            <span className="font-display rounded-xl bg-accent px-2.5 py-0.5 text-xl font-extrabold uppercase text-accent-ink">
              {match.spots_left === 1 ? "Falta 1" : `Faltan ${match.spots_left}`}
            </span>
            <SpotsMeter needed={match.spots_needed} left={match.spots_left} />
          </div>
        ) : (
          <span className="rounded-xl bg-surface-2 px-2.5 py-1 text-sm font-bold text-ink-soft">
            {match.status === "full" ? "Completo" : match.status === "closed" ? "Cerrado" : match.status === "cancelled" ? "Cancelado" : "Jugado"}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="font-semibold leading-snug">{match.venue_name}</p>
        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {match.venue_address} · {match.city.name}
          </span>
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold text-ink-soft">
        <li className="rounded-full bg-surface-2 px-2.5 py-1">{formatLevelRange(levels, match.level_min, match.level_max)}</li>
        <li className="rounded-full bg-surface-2 px-2.5 py-1">{formatAgeRange(match.age_min, match.age_max)}</li>
        <li className={cn("rounded-full px-2.5 py-1", match.price_per_person > 0 ? "bg-surface-2" : "bg-primary-soft text-primary")}>
          {formatPrice(match.price_per_person)}
        </li>
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink-soft">
          <Avatar name={match.organizer.full_name} url={match.organizer.avatar_url} size={24} />
          <span className="truncate">{isMine ? "Lo organizás vos" : match.organizer.full_name}</span>
        </span>
        {badge ?? (!isMine && <CompatTag compat={compat} />)}
      </div>
    </Link>
  );
}
