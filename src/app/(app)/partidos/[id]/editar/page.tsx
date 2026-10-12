import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MatchForm } from "@/components/match/match-form";
import { updateMatch } from "@/lib/actions/matches";
import { getCities, getSports } from "@/lib/data/catalog";
import { getMatchDetail } from "@/lib/data/matches";
import { getMyProfile } from "@/lib/data/profile";
import { dateKeyInAR, timeInAR } from "@/lib/domain/time";

export const metadata: Metadata = { title: "Editar partido" };

export default async function EditMatchPage({ params }: PageProps<"/partidos/[id]/editar">) {
  const { id } = await params;
  const [profile, sports, cities, detail] = await Promise.all([
    getMyProfile(),
    getSports(),
    getCities(),
    getMatchDetail(id),
  ]);
  if (!profile || !detail) notFound();
  const { match, participants } = detail;
  if (match.organizer_id !== profile.id || !["open", "full", "closed"].includes(match.status)) {
    redirect(`/partidos/${id}`);
  }
  const startsAt = new Date(match.starts_at);

  return (
    <div className="px-5 pt-4 pb-10">
      <Link href={`/partidos/${id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft">
        <ArrowLeft className="size-4" /> Partido
      </Link>
      <h1 className="font-display mb-4 mt-3 text-4xl font-extrabold uppercase leading-none">Editar partido</h1>
      <MatchForm
        mode="edit"
        action={updateMatch.bind(null, id)}
        sports={sports}
        cities={cities}
        todayKey={dateKeyInAR(new Date())}
        confirmedCount={participants.filter((p) => p.status === "confirmed").length}
        initial={{
          sportId: match.sport_id,
          date: dateKeyInAR(startsAt),
          time: timeInAR(startsAt),
          venueName: match.venue_name,
          venueAddress: match.venue_address,
          cityId: cities.find((c) => c.name === match.city.name)?.id ?? cities[0].id,
          totalPlayers: match.total_players,
          spotsNeeded: match.spots_needed,
          levelMin: match.level_min,
          levelMax: match.level_max,
          ageMin: match.age_min,
          ageMax: match.age_max,
          price: Number(match.price_per_person),
          acceptanceMode: match.acceptance_mode,
          description: match.description ?? "",
        }}
      />
    </div>
  );
}
