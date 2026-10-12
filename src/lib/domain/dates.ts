import { addDaysToKey, APP_LOCALE, APP_TIME_ZONE, dateKeyInAR, timeInAR } from "./time";

const weekdayShort = new Intl.DateTimeFormat(APP_LOCALE, { timeZone: APP_TIME_ZONE, weekday: "short" });
const dayMonth = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "short",
});
const longDate = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clean(s: string) {
  return s.replace(/\./g, "");
}

/** "Hoy", "Mañana", "Jue 16 oct". */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const key = dateKeyInAR(date);
  const today = dateKeyInAR(now);
  if (key === today) return "Hoy";
  if (key === addDaysToKey(today, 1)) return "Mañana";
  return `${capitalize(clean(weekdayShort.format(date)))} ${clean(dayMonth.format(date))}`;
}

/** "Hoy · 21:00". */
export function formatMatchWhen(iso: string, now: Date = new Date()): string {
  return `${formatDayLabel(iso, now)} · ${timeInAR(new Date(iso))}`;
}

/** "Jueves 16 de octubre". */
export function formatLongDate(iso: string): string {
  return capitalize(longDate.format(new Date(iso)));
}

export function formatTime(iso: string): string {
  return timeInAR(new Date(iso));
}
