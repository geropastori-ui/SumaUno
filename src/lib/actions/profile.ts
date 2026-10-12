"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/data/session";
import { isAdult } from "@/lib/domain/age";
import { normalizeArMobile } from "@/lib/domain/whatsapp";
import { friendlyDbError } from "@/lib/errors";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string; fieldErrors?: Record<string, string> };

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Contanos tu nombre.").max(80, "Usá un nombre más corto."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí tu fecha de nacimiento.")
    .refine((v) => isAdult(v), "Por ahora SumáUno es solo para mayores de 18 años.")
    .refine((v) => v >= "1920-01-01", "Revisá tu fecha de nacimiento."),
  cityId: z.uuid("Elegí tu ciudad."),
  whatsapp: z
    .string()
    .transform((v) => normalizeArMobile(v))
    .refine((v): v is string => v !== null, "Ingresá el código de área sin 0 y el número sin 15."),
  sports: z
    .string()
    .transform((v, ctx) => {
      try {
        return z.record(z.uuid(), z.number().int().positive()).parse(JSON.parse(v));
      } catch {
        ctx.addIssue({ code: "custom", message: "Revisá los deportes elegidos." });
        return z.NEVER;
      }
    })
    .refine((v) => Object.keys(v).length > 0, "Elegí al menos un deporte con tu nivel."),
  mode: z.enum(["onboarding", "edit"]),
  next: z.string().optional(),
});

export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const { fullName, birthDate, cityId, whatsapp, sports, mode, next } = parsed.data;
  const supabase = await createClient();

  const profileRes = await supabase
    .from("profiles")
    .update({ full_name: fullName, city_id: cityId })
    .eq("id", user.id);
  if (profileRes.error) return { error: friendlyDbError(profileRes.error) };

  const privateRes = await supabase
    .from("profile_private")
    .update({ birth_date: birthDate, whatsapp })
    .eq("profile_id", user.id);
  if (privateRes.error) return { error: friendlyDbError(privateRes.error) };

  const selected = Object.keys(sports);
  const removeRes = await supabase
    .from("player_sports")
    .delete()
    .eq("profile_id", user.id)
    .not("sport_id", "in", `(${selected.join(",")})`);
  if (removeRes.error) return { error: friendlyDbError(removeRes.error) };

  const upsertRes = await supabase.from("player_sports").upsert(
    Object.entries(sports).map(([sportId, rank]) => ({
      profile_id: user.id,
      sport_id: sportId,
      level_rank: rank,
    })),
    { onConflict: "profile_id,sport_id" },
  );
  if (upsertRes.error) return { error: friendlyDbError(upsertRes.error) };

  revalidatePath("/", "layout");

  if (mode === "onboarding") {
    await supabase.rpc("track_event", { p_name: "onboarding_completed" });
    redirect(safeNext(next) as "/explorar");
  }
  redirect("/perfil");
}

export async function setAvatarUrl(url: string | null) {
  const user = await getSessionUser();
  if (!user) return { error: "Necesitás iniciar sesión." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/", "layout");
  return {};
}
