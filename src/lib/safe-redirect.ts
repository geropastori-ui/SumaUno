/** Solo permite redirecciones internas (evita open redirects con ?next=). */
export function safeNext(next: unknown, fallback = "/explorar"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
