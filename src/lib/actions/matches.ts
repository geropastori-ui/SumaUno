"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/data/session";
import { arLocalToIso } from "@/lib/domain/time";
import { friendlyDbError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type MatchFormState = { error?: string; fieldErrors?: Record<string, string> };

const optionalInt = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), "Valor inválido.");

const matchSchema = z
  .object({
    sportId: z.uuid("Elegí el deporte."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí el día."),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Elegí la hora."),
    venueName: z.string().trim().min(2, "¿Dónde se juega?").max(80, "Usá un nombre más corto."),
    venueAddress: z.string().trim().min(2, "Poné la dirección.").max(120, "Usá una dirección más corta."),
    cityId: z.uuid("Elegí la ciudad."),
    totalPlayers: z.coerce.number().int().min(2).max(30),
    spotsNeeded: z.coerce.number().int().min(1, "Tiene que faltar al menos uno."),
    levelMin: optionalInt(1, 50),
    levelMax: optionalInt(1, 50),
    ageMin: optionalInt(18, 99),
    ageMax: optionalInt(18, 99),
    price: z.coerce
      .number({ error: "Poné un número." })
      .int("Usá un monto sin centavos.")
      .min(0, "El costo no puede ser negativo.")
      .max(1_000_000, "Revisá el costo."),
    acceptanceMode: z.enum(["auto", "approval"]),
    description: z.string().trim().max(500, "Máximo 500 caracteres.").optional(),
  })
  .refine((d) => d.spotsNeeded < d.totalPlayers, {
    path: ["spotsNeeded"],
    message: "Los que faltan tienen que ser menos que el total (vos ya estás).",
  })
  .refine((d) => d.levelMin == null || d.levelMax == null || d.levelMin <= d.levelMax, {
    path: ["levelMin"],
    message: "Revisá el rango de nivel.",
  })
  .refine((d) => d.ageMin == null || d.ageMax == null || d.ageMin <= d.ageMax, {
    path: ["ageMin"],
    message: "Revisá el rango de edad.",
  })
  .transform((d) => ({ ...d, startsAt: arLocalToIso(d.date, d.time) }))
  .refine((d) => new Date(d.startsAt).getTime() > Date.now(), {
    path: ["time"],
    message: "Ese horario ya pasó.",
  });

function parse(formData: FormData) {
  const parsed = matchSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) return { data: parsed.data } as const;
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { fieldErrors } as const;
}

function toRow(d: z.output<typeof matchSchema>) {
  return {
    city_id: d.cityId,
    starts_at: d.startsAt,
    venue_name: d.venueName,
    venue_address: d.venueAddress,
    total_players: d.totalPlayers,
    spots_needed: d.spotsNeeded,
    level_min: d.levelMin,
    level_max: d.levelMax,
    age_min: d.ageMin,
    age_max: d.ageMax,
    price_per_person: d.price,
    acceptance_mode: d.acceptanceMode,
    description: d.description || null,
  };
}

export async function createMatch(_prev: MatchFormState, formData: FormData): Promise<MatchFormState> {
  if (!(await getSessionUser())) redirect("/login");
  const result = parse(formData);
  if (!result.data) return { fieldErrors: result.fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({ ...toRow(result.data), sport_id: result.data.sportId })
    .select("id")
    .single();
  if (error) return { error: friendlyDbError(error) };

  revalidatePath("/explorar");
  revalidatePath("/mis-partidos");
  redirect(`/partidos/${data.id}?nuevo=1`);
}

export async function updateMatch(
  matchId: string,
  _prev: MatchFormState,
  formData: FormData,
): Promise<MatchFormState> {
  if (!(await getSessionUser())) redirect("/login");
  const result = parse(formData);
  if (!result.data) return { fieldErrors: result.fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .update(toRow(result.data))
    .eq("id", matchId)
    .select("id");
  if (error) return { error: friendlyDbError(error) };
  if (!data.length) return { error: "No podés editar este partido." };

  revalidatePath(`/partidos/${matchId}`);
  revalidatePath("/explorar");
  redirect(`/partidos/${matchId}`);
}
