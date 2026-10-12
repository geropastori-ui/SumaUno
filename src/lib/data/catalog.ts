import "server-only";
import { cache } from "react";
import type { SportLevel } from "@/lib/domain/levels";
import { createClient } from "@/lib/supabase/server";

export type Sport = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  typicalPlayers: number;
  levels: SportLevel[];
};

export type City = { id: string; slug: string; name: string; province: string };

export const getSports = cache(async (): Promise<Sport[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports")
    .select("id, slug, name, icon, typical_players, sport_levels (rank, name, description)")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    icon: s.icon,
    typicalPlayers: s.typical_players,
    levels: [...s.sport_levels].sort((a, b) => a.rank - b.rank),
  }));
});

export const getCities = cache(async (): Promise<City[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, slug, name, province")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data;
});
