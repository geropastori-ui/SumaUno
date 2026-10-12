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
