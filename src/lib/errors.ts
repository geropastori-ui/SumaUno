const GENERIC = "Algo salió mal. Probá de nuevo en un momento.";

type MaybeDbError = { code?: string; message?: string } | null | undefined;

// Códigos que usan las funciones de la base con mensajes ya pensados para el usuario.
const FRIENDLY_DB_CODES = new Set(["P0001", "P0002", "28000", "42501"]);

/** Mensaje en castellano para mostrar a partir de un error de Supabase/Postgres. */
export function friendlyDbError(error: MaybeDbError): string {
  if (!error) return GENERIC;
  const { code, message } = error;
  if (code && FRIENDLY_DB_CODES.has(code) && message) {
    if (code === "42501" && message.startsWith("permission denied")) {
      return "No tenés permiso para hacer eso.";
    }
    return message;
  }
  if (code === "23514" && message && !message.startsWith("new row")) return message;
  if (code === "23505") return "Eso ya existe.";
  return GENERIC;
}

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "El email o la contraseña no coinciden.",
  user_already_exists: "Ya hay una cuenta con ese email. Probá iniciar sesión.",
  email_exists: "Ya hay una cuenta con ese email. Probá iniciar sesión.",
  weak_password: "La contraseña es muy débil: usá al menos 8 caracteres.",
  email_not_confirmed: "Todavía no confirmaste tu email. Revisá tu casilla (y el spam).",
  over_email_send_rate_limit: "Mandamos demasiados mails seguidos. Esperá un ratito y probá de nuevo.",
  over_request_rate_limit: "Demasiados intentos. Esperá un ratito y probá de nuevo.",
  signup_disabled: "Por ahora no se pueden crear cuentas nuevas.",
  unexpected_failure: GENERIC,
};

export function friendlyAuthError(error: { code?: string; message?: string } | null): string {
  if (!error) return GENERIC;
  if (error.code && AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code];
  // El trigger de la base rechaza menores de 18 y el error llega envuelto.
  if (error.message?.includes("Database error saving new user")) {
    return "No pudimos crear la cuenta. Revisá tu fecha de nacimiento: SumáUno es para mayores de 18.";
  }
  return GENERIC;
}

export { GENERIC as GENERIC_ERROR };
