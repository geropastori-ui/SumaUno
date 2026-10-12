"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdult, MIN_AGE } from "@/lib/domain/age";
import { env } from "@/lib/env";
import { friendlyAuthError } from "@/lib/errors";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  info?: string;
  values?: Record<string, string>;
};

const emailSchema = z.email("Revisá el email.").transform((v) => v.trim().toLowerCase());

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña."),
});

const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Contanos tu nombre.")
    .max(80, "Usá un nombre más corto."),
  email: emailSchema,
  password: z.string().min(8, "Usá al menos 8 caracteres."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí tu fecha de nacimiento.")
    .refine((v) => isAdult(v), `Por ahora SumáUno es solo para mayores de ${MIN_AGE} años.`)
    .refine((v) => v >= "1920-01-01", "Revisá tu fecha de nacimiento."),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : env.siteUrl;
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendlyAuthError(error), values };

  redirect(safeNext(formData.get("next")) as "/explorar");
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
  };
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/bienvenida`,
      data: { full_name: parsed.data.fullName, birth_date: parsed.data.birthDate },
    },
  });
  if (error) return { error: friendlyAuthError(error), values };

  // Si el proyecto pide confirmar el email, no hay sesión todavía.
  if (!data.session) {
    return {
      info: `Listo. Te mandamos un mail a ${parsed.data.email} para confirmar tu cuenta.`,
      values,
    };
  }
  redirect("/bienvenida");
}

export async function loginWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) {
    redirect("/login?error=google");
  }
  redirect(data.url as "/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
