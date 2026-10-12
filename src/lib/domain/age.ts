import { dateKeyInAR } from "./time";

export const MIN_AGE = 18;

/** Edad en años cumplidos a la fecha (calendario argentino). */
export function ageFromBirthDate(birthDate: string, now: Date = new Date()): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = dateKeyInAR(now).split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

export function isAdult(birthDate: string, now: Date = new Date()): boolean {
  return ageFromBirthDate(birthDate, now) >= MIN_AGE;
}

/** Fecha máxima de nacimiento permitida (hoy hace 18 años), en formato YYYY-MM-DD. */
export function maxBirthDate(now: Date = new Date()): string {
  const [y, m, d] = dateKeyInAR(now).split("-");
  return `${Number(y) - MIN_AGE}-${m}-${d}`;
}
