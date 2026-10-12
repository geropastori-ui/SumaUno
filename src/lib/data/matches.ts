import "server-only";
import type { DayFilter } from "@/lib/domain/explore-filters";
import { dayRange } from "@/lib/domain/explore-filters";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

export type MatchListItem = Pick<
  MatchRow,
  | "id"
  | "starts_at"
  | "venue_name"
  | "venue_address"
  | "total_players"
  | "spots_needed"
  | "spots_left"
  | "level_min"
  | "level_max"
  | "age_min"
  | "age_max"
  | "price_per_person"
  | "acceptance_mode"
  | "status"
  | "sport_id"
  | "organizer_id"
> & {
  sport: { slug: string; name: string; icon: string };
  city: { name: string };
  organizer: { full_name: string; avatar_url: string | null };
};

export const MATCH_LIST_SELECT = `
  id, starts_at, venue_name, venue_address, total_players, spots_needed, spots_left,
  level_min, level_max, age_min, age_max, price_per_person, acceptance_mode, status,
  sport_id, organizer_id,
  sport:sports!inner (slug, name, icon),
  city:cities!inner (name),
  organizer:profiles!matches_organizer_id_fkey!inner (full_name, avatar_url)
`;

export type SearchArgs = {
  cityId: string | null;
  sportIds: string[];
  day: DayFilter | null;
  levelMin: number | null;
  levelMax: number | null;
  ageMin: number | null;
  ageMax: number | null;
  forMe: boolean;
};

export async function searchMatches(args: SearchArgs): Promise<MatchListItem[]> {
  const supabase = await createClient();
  const { from, to } = dayRange(args.day);
  const { data, error } = await supabase
    .rpc("search_matches", {
      p_city_id: args.cityId ?? undefined,
      p_sport_ids: args.sportIds.length ? args.sportIds : undefined,
      p_from: from ?? undefined,
      p_to: to ?? undefined,
      p_level_min: args.levelMin ?? undefined,
      p_level_max: args.levelMax ?? undefined,
      p_age_min: args.ageMin ?? undefined,
      p_age_max: args.ageMax ?? undefined,
      p_for_me: args.forMe,
      p_limit: 60,
    })
    .select(MATCH_LIST_SELECT);
  if (error) throw error;
  return data as unknown as MatchListItem[];
}

export type MatchDetail = MatchListItem & {
  description: string | null;
  created_at: string;
  filled_at: string | null;
};

export type Participant = {
  participant_id: string;
  profile_id: string;
  full_name: string;
  avatar_url: string | null;
  age: number | null;
  level_rank: number | null;
  level_name: string | null;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  out_of_level: boolean;
  created_at: string;
};

export type Contact = { profile_id: string; full_name: string; whatsapp: string; is_organizer: boolean };

export async function getMatchDetail(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: match, error } = await supabase
    .from("matches")
    .select(`${MATCH_LIST_SELECT}, description, created_at, filled_at`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!match) return null;
  const detail = match as unknown as MatchDetail;

  const [participantsRes, organizerAgeRes, organizerLevelRes, contactsRes] = await Promise.all([
    supabase.rpc("get_match_participants", { p_match_id: id }),
    supabase.rpc("profile_age", { p_profile_id: detail.organizer_id }),
    supabase
      .from("player_sports")
      .select("level_rank")
      .eq("profile_id", detail.organizer_id)
      .eq("sport_id", detail.sport_id)
      .maybeSingle(),
    supabase.rpc("get_match_contacts", { p_match_id: id }),
  ]);
  if (participantsRes.error) throw participantsRes.error;

  return {
    match: detail,
    participants: participantsRes.data as Participant[],
    organizerAge: organizerAgeRes.data ?? null,
    organizerLevel: organizerLevelRes.data?.level_rank ?? null,
    contacts: (contactsRes.data ?? []) as Contact[],
  };
}

export type MyMatchItem = MatchListItem & {
  role: "organizer" | "player";
  myStatus: "pending" | "confirmed" | null;
  pendingRequests: number;
};

/** Partidos que organizo y en los que estoy anotado (pendiente o confirmado). */
export async function getMyMatches(profileId: string): Promise<MyMatchItem[]> {
  const supabase = await createClient();
  const [organizedRes, joinedRes] = await Promise.all([
    supabase.from("matches").select(MATCH_LIST_SELECT).eq("organizer_id", profileId).order("starts_at"),
    supabase
      .from("match_participants")
      .select(`status, match:matches!inner (${MATCH_LIST_SELECT})`)
      .eq("profile_id", profileId)
      .in("status", ["pending", "confirmed"]),
  ]);
  if (organizedRes.error) throw organizedRes.error;
  if (joinedRes.error) throw joinedRes.error;

  const organized = organizedRes.data as unknown as MatchListItem[];
  const ids = organized.map((m) => m.id);
  const pendingByMatch = new Map<string, number>();
  if (ids.length) {
    const { data } = await supabase
      .from("match_participants")
      .select("match_id")
      .in("match_id", ids)
      .eq("status", "pending");
    for (const row of data ?? []) pendingByMatch.set(row.match_id, (pendingByMatch.get(row.match_id) ?? 0) + 1);
  }

  const joined = (joinedRes.data as unknown as Array<{ status: "pending" | "confirmed"; match: MatchListItem }>).map(
    (row): MyMatchItem => ({ ...row.match, role: "player", myStatus: row.status, pendingRequests: 0 }),
  );

  return [
    ...organized.map((m): MyMatchItem => ({
      ...m,
      role: "organizer",
      myStatus: null,
      pendingRequests: pendingByMatch.get(m.id) ?? 0,
    })),
    ...joined,
  ].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

/** Próximo: activo y no empezado hace más de 2 horas (mismo criterio que el archivado automático). */
export function isUpcoming(m: Pick<MatchListItem, "status" | "starts_at">, now = Date.now()) {
  return ["open", "full", "closed"].includes(m.status) && new Date(m.starts_at).getTime() > now - 2 * 3600_000;
}
