/** Escribe una cookie desde el navegador (preferencias de UI que también lee el servidor). */
export function setClientCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}
