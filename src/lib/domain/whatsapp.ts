/**
 * Normaliza un celular argentino al formato internacional que usa wa.me: 549 + área + número.
 * Acepta "342 412-3456", "0342 4123456", "+54 9 342 4123456", "5493424123456".
 * Devuelve null si no tiene 10 dígitos (área sin 0 + número sin 15).
 */
export function normalizeArMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("549")) digits = digits.slice(3);
  else if (digits.startsWith("54")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[1-9]\d{9}$/.test(digits)) return null;
  return `549${digits}`;
}

/** Muestra un número guardado (5493424123456) como "342 412-3456". */
export function formatArMobile(stored: string): string {
  const local = stored.startsWith("549") ? stored.slice(3) : stored;
  if (local.length !== 10) return stored;
  return `${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
