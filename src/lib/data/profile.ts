import "server-only";
import { cache } from "react";
import { ageFromBirthDate } from "@/lib/domain/age";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "./session";

export type MyProfile = {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  cityId: string | null;
  role: "player" | "club_admin" | "platform_admin";
  birthDate: string | null;
  age: number | null;
  whatsapp: string | null;
  /** sportId → rank */
  levels: Record<string, number>;
  isComplete: boolean;
};

/** Perfil completo del usuario logueado (incluye sus datos privados). */
export const getMyProfile = cache(async (): Promise<MyProfile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();

  const [profileRes, privateRes, sportsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, city_id, role").eq("id", user.id).single(),
    supabase.from("profile_private").select("birth_date, whatsapp").eq("profile_id", user.id).maybeSingle(),
    supabase.from("player_sports").select("sport_id, level_rank").eq("profile_id", user.id),
  ]);

  if (profileRes.error) throw profileRes.error;
  const profile = profileRes.data;
  const birthDate = privateRes.data?.birth_date ?? null;
  const whatsapp = privateRes.data?.whatsapp ?? null;
  const levels = Object.fromEntries((sportsRes.data ?? []).map((s) => [s.sport_id, s.level_rank]));

  return {
    id: profile.id,
    email: user.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    cityId: profile.city_id,
    role: profile.role,
    birthDate,
    age: birthDate ? ageFromBirthDate(birthDate) : null,
    whatsapp,
    levels,
    isComplete: Boolean(
      profile.full_name.trim() && profile.city_id && birthDate && whatsapp && Object.keys(levels).length,
    ),
  };
});
