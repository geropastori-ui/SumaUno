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
