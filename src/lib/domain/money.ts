import { APP_LOCALE } from "./time";

const ars = new Intl.NumberFormat(APP_LOCALE, {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  if (amount <= 0) return "Gratis";
  return ars.format(amount);
}
