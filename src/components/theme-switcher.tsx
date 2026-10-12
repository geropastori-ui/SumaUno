"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { setClientCookie } from "@/lib/client-cookie";
import { cn } from "@/lib/cn";

export type Theme = "system" | "light" | "dark";

const options = [
  { value: "system", label: "Sistema", Icon: Monitor },
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
] as const;

function applyTheme(value: Theme) {
  setClientCookie("theme", value, 60 * 60 * 24 * 365);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (value !== "system") root.classList.add(value);
}

export function ThemeSwitcher({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  function choose(value: Theme) {
    setTheme(value);
    applyTheme(value);
  }

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => choose(value)}
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition",
            theme === value ? "bg-surface text-ink shadow-card" : "text-muted",
          )}
        >
          <Icon className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}
