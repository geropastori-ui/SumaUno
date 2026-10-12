export const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const APP_LOCALE = "es-AR";

/** Fecha "YYYY-MM-DD" del día calendario en Argentina para un instante dado. */
export function dateKeyInAR(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts;
}

/** Suma días a una fecha "YYYY-MM-DD" (calendario, sin zonas horarias). */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

/** Día de la semana (0 = domingo) de una fecha "YYYY-MM-DD". */
export function weekdayOfKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Convierte fecha y hora locales de Argentina ("2026-10-14", "21:30") a un instante ISO.
 * Argentina usa UTC-3 todo el año (sin horario de verano desde 2009).
 */
export function arLocalToIso(dateKey: string, time: string): string {
  return new Date(`${dateKey}T${time}:00-03:00`).toISOString();
}

/** Inicio del día local argentino como instante ISO. */
export function startOfDayIso(dateKey: string): string {
  return arLocalToIso(dateKey, "00:00");
}

/** Hora local "HH:MM" en Argentina de un instante. */
export function timeInAR(date: Date): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
