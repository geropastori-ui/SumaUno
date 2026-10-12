"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Valor de localStorage seguro para SSR (en el servidor siempre es null). */
export function useLocalStorage(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const set = useCallback(
    (next: string | null) => {
      try {
        if (next == null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, next);
      } catch {
        // Modo privado o almacenamiento bloqueado: no pasa nada, es solo una comodidad.
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, set];
}
