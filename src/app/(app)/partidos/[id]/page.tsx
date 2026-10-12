import { CalendarClock, MapPin, PartyPopper, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { CompatTag } from "@/components/match/compat-tag";
import { JoinBar } from "@/components/match/join-bar";
import { MatchLive } from "@/components/match/match-live";
import { OrganizerBar } from "@/components/match/organizer-bar";
import { ParticipantRow } from "@/components/match/participant-row";
import { ShareButton } from "@/components/match/share-button";
import { SpotsMeter } from "@/components/match/spots-meter";
import { SportBadge } from "@/components/sport-icon";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { getSports } from "@/lib/data/catalog";
import { getMatchDetail } from "@/lib/data/matches";
import { getMyProfile } from "@/lib/data/profile";
import { evaluateCompatibility } from "@/lib/domain/compatibility";
import { formatLongDate, formatMatchWhen, formatTime } from "@/lib/domain/dates";
import { formatAgeRange, formatLevelRange, levelName } from "@/lib/domain/levels";
import { formatPrice } from "@/lib/domain/money";
import { whatsappLink } from "@/lib/domain/whatsapp";

export const metadata: Metadata = { title: "Partido" };

const STATUS_LABEL = {
  open: null,
  full: "Completo",
  closed: "Inscripción cerrada",
  cancelled: "Cancelado",
  finished: "Ya se jugó",
} as const;

export default async function MatchPage({ params, searchParams }: PageProps<"/partidos/[id]">) {
  const [{ id }, query, profile, sports] = await Promise.all([params, searchParams, getMyProfile(), getSports()]);
  if (!profile) return null;
  const detail = await getMatchDetail(id);
  if (!detail) notFound();

  const { match, participants, organizerAge, organizerLevel, contacts } = detail;
  const sport = sports.find((s) => s.id === match.sport_id);
  const levels = sport?.levels ?? [];
  const isOrganizer = match.organizer_id === profile.id;
  const me = participants.find((p) => p.profile_id === profile.id);
  const confirmed = participants.filter((p) => p.status === "confirmed");
  const pendingReqs = participants.filter((p) => p.status === "pending" && p.profile_id !== profile.id);
  const canManage = isOrganizer && ["open", "full", "closed"].includes(match.status);
  const when = formatMatchWhen(match.starts_at);
  const compat = evaluateCompatibility(
    {
      sportId: match.sport_id,
      levelMin: match.level_min,
      levelMax: match.level_max,
      ageMin: match.age_min,
      ageMax: match.age_max,
      acceptanceMode: match.acceptance_mode,
    },
    { age: profile.age, levels: profile.levels },
  );

  const shareText = `Nos ${match.spots_left === 1 ? "falta 1" : `faltan ${match.spots_left}`} para ${match.sport.name} ${when.toLowerCase()} en ${match.venue_name}. ¿Te sumás?`;
  const myFirstName = profile.fullName.split(" ")[0];
  const organizerContact = contacts.find((c) => c.is_organizer);
  const contactByProfile = new Map(contacts.filter((c) => !c.is_organizer).map((c) => [c.profile_id, c.whatsapp]));
  const matchRef = `${match.sport.name} del ${when.toLowerCase()} en ${match.venue_name}`;
  const statusLabel = STATUS_LABEL[match.status];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${match.venue_name}, ${match.venue_address}, ${match.city.name}`,
  )}`;

  return (
    <div className="pb-36">
      <MatchLive matchId={match.id} />

      <div className="flex items-center justify-between px-5 pt-4">
        <BackLink fallback="/explorar" />
        {statusLabel && (
          <span className="rounded-full bg-surface-2 px-3 py-1 text-sm font-bold text-ink-soft">{statusLabel}</span>
        )}
      </div>

      {query.nuevo === "1" && isOrganizer && (
        <div className="mx-5 mt-2 animate-pop rounded-3xl bg-accent p-4 text-accent-ink">
          <p className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase">
            <PartyPopper className="size-6" aria-hidden /> ¡Publicado!
          </p>
          <p className="mt-1 text-sm font-medium">
            Ya aparece en Explorar. Compartilo en tus grupos para llenarlo más rápido.
          </p>
          <div className="mt-3">
            <ShareButton matchId={match.id} text={shareText} variant="primary" label="Compartir partido" />
          </div>
        </div>
      )}

      <header className="px-5 pt-4">
        <div className="flex items-center gap-3">
          <SportBadge icon={match.sport.icon} size={52} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{match.sport.name}</p>
            <h1 className="font-display text-3xl font-extrabold uppercase leading-none">{when}</h1>
          </div>
        </div>
        {!isOrganizer && (
          <div className="mt-3">
            <CompatTag compat={compat} />
          </div>
        )}
      </header>

      <section className="mx-5 mt-5 rounded-3xl bg-surface p-5 shadow-card">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-soft">
              {match.status === "open" ? "Lugares libres" : "Lugares"}
            </p>
            <p className="font-display text-5xl font-extrabold leading-none">
              {match.spots_left}
              <span className="text-2xl text-muted"> / {match.spots_needed}</span>
            </p>
          </div>
          <div className="text-right">
            <SpotsMeter needed={match.spots_needed} left={match.spots_left} className="justify-end" />
            <p className="mt-1 text-sm text-muted">{match.total_players} jugadores en total</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-muted">Nivel</dt>
            <dd className="font-semibold">{formatLevelRange(levels, match.level_min, match.level_max)}</dd>
          </div>
          <div>
            <dt className="text-muted">Edad</dt>
            <dd className="font-semibold">{formatAgeRange(match.age_min, match.age_max)}</dd>
          </div>
          <div>
            <dt className="text-muted">Costo por persona</dt>
            <dd className="flex items-center gap-1 font-semibold">
              <Wallet className="size-4 text-muted" aria-hidden /> {formatPrice(match.price_per_person)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Cómo se suman</dt>
            <dd className="font-semibold">{match.acceptance_mode === "auto" ? "Automático" : "Con aprobación"}</dd>
          </div>
        </dl>
      </section>

      <section className="mx-5 mt-3 rounded-3xl bg-surface p-5 shadow-card">
        <p className="flex items-start gap-2">
          <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block font-semibold">{formatLongDate(match.starts_at)}</span>
            <span className="text-ink-soft">{formatTime(match.starts_at)} hs</span>
          </span>
        </p>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-start gap-2">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block font-semibold">{match.venue_name}</span>
            <span className="text-ink-soft underline decoration-line underline-offset-4">
              {match.venue_address}, {match.city.name}
            </span>
          </span>
        </a>
        {match.description && (
          <p className="mt-4 whitespace-pre-line border-t border-line pt-4 text-ink-soft">{match.description}</p>
        )}
      </section>

      <section className="mx-5 mt-3 flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-card">
        <Avatar name={match.organizer.full_name} url={match.organizer.avatar_url} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Organiza</p>
          <p className="truncate font-semibold">{isOrganizer ? "Vos" : match.organizer.full_name}</p>
          <p className="text-sm text-ink-soft">
            {[organizerAge != null ? `${organizerAge} años` : null, levelName(levels, organizerLevel)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </section>

      {canManage && pendingReqs.length > 0 && (
        <section className="mx-5 mt-6" aria-labelledby="requests-title">
          <h2 id="requests-title" className="font-display text-xl font-bold uppercase">
            Solicitudes <span className="text-warn">({pendingReqs.length})</span>
          </h2>
          <ul className="mt-1 divide-y divide-line">
            {pendingReqs.map((p) => (
              <ParticipantRow key={p.participant_id} matchId={match.id} participant={p} isMe={false} canManage />
            ))}
          </ul>
        </section>
      )}

      <section className="mx-5 mt-6" aria-labelledby="players-title">
        <h2 id="players-title" className="font-display text-xl font-bold uppercase">
          Anotados <span className="text-muted">({confirmed.length})</span>
        </h2>
        {confirmed.length === 0 ? (
          <p className="mt-2 text-ink-soft">
            {isOrganizer ? "Todavía nadie. Compartí el partido para que se sumen." : "Todavía nadie. ¡Podés ser el primero!"}
          </p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {confirmed.map((p) => {
              const phone = contactByProfile.get(p.profile_id);
              return (
                <ParticipantRow
                  key={p.participant_id}
                  matchId={match.id}
                  participant={p}
                  isMe={p.profile_id === profile.id}
                  canManage={canManage}
                  whatsappHref={
                    phone
                      ? whatsappLink(
                          phone,
                          `¡Hola ${p.full_name.split(" ")[0]}! Soy ${myFirstName}, organizo el ${matchRef}. Te escribo por SumáUno para coordinar.`,
                        )
                      : undefined
                  }
                />
              );
            })}
          </ul>
        )}
      </section>

      {match.status === "cancelled" && me?.status === "confirmed" && (
        <Alert tone="warn" className="mx-5 mt-4">
          El organizador canceló este partido.
        </Alert>
      )}

      {isOrganizer ? (
        <OrganizerBar
          matchId={match.id}
          matchStatus={match.status}
          shareText={shareText}
          confirmedCount={confirmed.length}
        />
      ) : (
        <JoinBar
          matchId={match.id}
          myStatus={me?.status ?? "none"}
          matchStatus={match.status}
          compat={compat}
          ageText={formatAgeRange(match.age_min, match.age_max)}
          organizerName={match.organizer.full_name}
          summary={{
            title: match.sport.name,
            when,
            venue: `${match.venue_name} · ${match.venue_address}`,
            price: formatPrice(match.price_per_person),
          }}
          organizerWhatsapp={
            organizerContact
              ? whatsappLink(
                  organizerContact.whatsapp,
                  `¡Hola ${organizerContact.full_name.split(" ")[0]}! Soy ${myFirstName}, me sumé a tu ${matchRef} por SumáUno.`,
                )
              : undefined
          }
        />
      )}
    </div>
  );
}
