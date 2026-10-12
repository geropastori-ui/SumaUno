import type { Metadata } from "next";
import { MatchForm } from "@/components/match/match-form";
import { PageHeader } from "@/components/page-header";
import { createMatch } from "@/lib/actions/matches";
import { getCities, getSports } from "@/lib/data/catalog";
import { getMyProfile } from "@/lib/data/profile";
import { addDaysToKey, dateKeyInAR, timeInAR } from "@/lib/domain/time";

export const metadata: Metadata = { title: "Publicar partido" };

export default async function PublishPage() {
  const [profile, sports, cities] = await Promise.all([getMyProfile(), getSports(), getCities()]);
  if (!profile) return null;

  const now = new Date();
  const todayKey = dateKeyInAR(now);
  // Si ya es tarde, lo más probable es que publique para mañana.
  const lateNight = timeInAR(now) >= "20:00";
  const sport = sports.find((s) => profile.levels[s.id] != null) ?? sports[0];

  return (
    <>
      <PageHeader title="Publicar" subtitle="Contá qué te falta y lo completamos." />
      <div className="px-5">
        <MatchForm
          mode="create"
          action={createMatch}
          sports={sports}
          cities={cities}
          todayKey={todayKey}
          initial={{
            sportId: sport.id,
            date: lateNight ? addDaysToKey(todayKey, 1) : todayKey,
            time: "21:00",
            venueName: "",
            venueAddress: "",
            cityId: profile.cityId ?? cities[0]?.id ?? "",
            totalPlayers: sport.typicalPlayers,
            spotsNeeded: 1,
            levelMin: null,
            levelMax: null,
            ageMin: null,
            ageMax: null,
            price: 0,
            acceptanceMode: "auto",
            description: "",
          }}
        />
      </div>
    </>
  );
}
