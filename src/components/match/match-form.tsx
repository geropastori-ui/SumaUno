"use client";

import { ArrowLeft, History, Users, UserCheck } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import type { MatchFormState } from "@/lib/actions/matches";
import type { City, Sport } from "@/lib/data/catalog";
import { cn } from "@/lib/cn";
import { addDaysToKey } from "@/lib/domain/time";
import { useLocalStorage } from "@/lib/use-local-storage";
import { SportBadge } from "@/components/sport-icon";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Stepper } from "@/components/ui/stepper";
import { SubmitButton } from "@/components/ui/submit-button";
import { AgeRangePicker } from "./age-range-picker";
import { LevelRangePicker } from "./level-range-picker";

export type MatchFormValues = {
  sportId: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  cityId: string;
  totalPlayers: number;
  spotsNeeded: number;
  levelMin: number | null;
  levelMax: number | null;
  ageMin: number | null;
  ageMax: number | null;
  price: number;
  acceptanceMode: "auto" | "approval";
  description: string;
};

type Props = {
  mode: "create" | "edit";
  action: (state: MatchFormState, formData: FormData) => Promise<MatchFormState>;
  sports: Sport[];
  cities: City[];
  initial: MatchFormValues;
  todayKey: string;
  /** En edición: confirmados actuales (no se puede buscar menos lugares que eso). */
  confirmedCount?: number;
};

const QUICK_TIMES = ["18:00", "19:00", "20:00", "21:00", "22:00"];
const LAST_VENUE_KEY = "sumauno:last-venue";

const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", timeZone: "UTC" });

function dayLabel(key: string, todayKey: string) {
  if (key === todayKey) return "Hoy";
  if (key === addDaysToKey(todayKey, 1)) return "Mañana";
  const [y, m, d] = key.split("-").map(Number);
  const label = weekday.format(new Date(Date.UTC(y, m - 1, d))).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MatchForm({ mode, action, sports, cities, initial, todayKey, confirmedCount = 0 }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [v, setV] = useState<MatchFormValues>(initial);
  const [lastVenueRaw, setLastVenue] = useLocalStorage(LAST_VENUE_KEY);
  const [showAge, setShowAge] = useState(initial.ageMin != null || initial.ageMax != null);
  const [customDate, setCustomDate] = useState(false);
  const fe = state.fieldErrors ?? {};
  const creating = mode === "create";

  const sport = sports.find((s) => s.id === v.sportId) ?? sports[0];
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysToKey(todayKey, i)), [todayKey]);
  const lastVenue = useMemo(() => {
    try {
      const parsed = lastVenueRaw ? (JSON.parse(lastVenueRaw) as { name: string; address: string }) : null;
      return parsed && parsed.name !== v.venueName ? parsed : null;
    } catch {
      return null;
    }
  }, [lastVenueRaw, v.venueName]);

  function update<K extends keyof MatchFormValues>(key: K, value: MatchFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function chooseSport(id: string) {
    const s = sports.find((x) => x.id === id);
    setV((prev) => ({
      ...prev,
      sportId: id,
      totalPlayers: s?.typicalPlayers ?? prev.totalPlayers,
      spotsNeeded: Math.min(prev.spotsNeeded, (s?.typicalPlayers ?? prev.totalPlayers) - 1),
      levelMin: null,
      levelMax: null,
    }));
  }

  const step1Ready = Boolean(v.sportId && v.date && /^\d{2}:\d{2}$/.test(v.time));
  const step2Ready = v.venueName.trim().length >= 2 && v.venueAddress.trim().length >= 2 && Boolean(v.cityId);
  const show = (n: 1 | 2 | 3) => !creating || step === n;
  const errorStep = fe.sportId || fe.date || fe.time ? 1 : fe.venueName || fe.venueAddress || fe.cityId ? 2 : null;

  function go(n: 1 | 2 | 3) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <form
      action={(fd) => {
        if (creating) setLastVenue(JSON.stringify({ name: v.venueName, address: v.venueAddress }));
        return formAction(fd);
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      {/* Todos los valores viajan como hidden: los pasos son solo visuales. */}
      <input type="hidden" name="sportId" value={v.sportId} />
      <input type="hidden" name="date" value={v.date} />
      <input type="hidden" name="time" value={v.time} />
      <input type="hidden" name="cityId" value={v.cityId} />
      <input type="hidden" name="totalPlayers" value={v.totalPlayers} />
      <input type="hidden" name="spotsNeeded" value={v.spotsNeeded} />
      <input type="hidden" name="levelMin" value={v.levelMin ?? ""} />
      <input type="hidden" name="levelMax" value={v.levelMax ?? ""} />
      <input type="hidden" name="ageMin" value={showAge ? (v.ageMin ?? "") : ""} />
      <input type="hidden" name="ageMax" value={showAge ? (v.ageMax ?? "") : ""} />
      <input type="hidden" name="acceptanceMode" value={v.acceptanceMode} />

      {creating && (
        <div className="flex items-center gap-2" aria-label={`Paso ${step} de 3`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={cn("h-1.5 flex-1 rounded-full transition-colors", n <= step ? "bg-primary" : "bg-line")} />
          ))}
        </div>
      )}

      {state.error && <Alert tone="error">{state.error}</Alert>}
      {creating && errorStep && step !== errorStep && (
        <Alert tone="error">
          Revisá el paso {errorStep}.{" "}
          <button type="button" className="underline" onClick={() => go(errorStep)}>
            Ir
          </button>
        </Alert>
      )}

      {/* Paso 1: deporte y cuándo */}
      <section hidden={!show(1)} className="flex flex-col gap-6">
        {creating && <h2 className="font-display text-3xl font-extrabold uppercase leading-none">¿Qué y cuándo?</h2>}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink-soft">Deporte</legend>
          <div className="grid grid-cols-3 gap-2">
            {sports.map((s) => {
              const active = s.id === v.sportId;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  disabled={!creating && !active}
                  onClick={() => chooseSport(s.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-3 transition active:scale-95 disabled:opacity-40",
                    active ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-line bg-surface",
                  )}
                >
                  <SportBadge icon={s.icon} size={40} />
                  <span className="text-sm font-semibold leading-tight">{s.name}</span>
                </button>
              );
            })}
          </div>
          {!creating && <p className="mt-2 text-sm text-muted">El deporte no se puede cambiar una vez publicado.</p>}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink-soft">Día</legend>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {days.map((d) => (
              <Chip
                key={d}
                selected={!customDate && v.date === d}
                onClick={() => {
                  setCustomDate(false);
                  update("date", d);
                }}
              >
                {dayLabel(d, todayKey)}
              </Chip>
            ))}
            <Chip selected={customDate || !days.includes(v.date)} onClick={() => setCustomDate(true)}>
              Otra fecha
            </Chip>
          </div>
          {(customDate || !days.includes(v.date)) && (
            <Input
              type="date"
              aria-label="Fecha del partido"
              className="mt-3"
              min={todayKey}
              value={v.date}
              onChange={(e) => update("date", e.target.value)}
            />
          )}
          {fe.date && <p className="mt-2 text-sm text-danger">{fe.date}</p>}
        </fieldset>

        <Field label="Hora" htmlFor="time-input" error={fe.time}>
          <div className="flex flex-wrap gap-2">
            {QUICK_TIMES.map((t) => (
              <Chip key={t} selected={v.time === t} onClick={() => update("time", t)}>
                {t}
              </Chip>
            ))}
          </div>
          <Input
            id="time-input"
            type="time"
            step={900}
            value={v.time}
            onChange={(e) => update("time", e.target.value)}
            className="mt-1 w-40"
            aria-invalid={Boolean(fe.time)}
          />
        </Field>

        {creating && (
          <Button size="lg" block disabled={!step1Ready} onClick={() => go(2)}>
            Seguir
          </Button>
        )}
      </section>

      {/* Paso 2: dónde */}
      <section hidden={!show(2)} className="flex flex-col gap-5">
        {creating && (
          <div>
            <BackButton onClick={() => go(1)} />
            <h2 className="font-display text-3xl font-extrabold uppercase leading-none">¿Dónde?</h2>
          </div>
        )}

        {lastVenue && (
          <button
            type="button"
            onClick={() => setV((prev) => ({ ...prev, venueName: lastVenue.name, venueAddress: lastVenue.address }))}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface p-3 text-left"
          >
            <History className="size-5 text-muted" aria-hidden />
            <span className="text-sm">
              <span className="block font-semibold">Usar {lastVenue.name}</span>
              <span className="text-muted">{lastVenue.address}</span>
            </span>
          </button>
        )}

        <Field label="Lugar" htmlFor="venueName" error={fe.venueName} hint="Nombre del complejo, club o plaza.">
          <Input
            id="venueName"
            name="venueName"
            value={v.venueName}
            onChange={(e) => update("venueName", e.target.value)}
            placeholder="Complejo La Redonda"
            maxLength={80}
            aria-invalid={Boolean(fe.venueName)}
          />
        </Field>
        <Field label="Dirección" htmlFor="venueAddress" error={fe.venueAddress}>
          <Input
            id="venueAddress"
            name="venueAddress"
            value={v.venueAddress}
            onChange={(e) => update("venueAddress", e.target.value)}
            placeholder="Av. Freyre 2150"
            autoComplete="street-address"
            maxLength={120}
            aria-invalid={Boolean(fe.venueAddress)}
          />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink-soft">Ciudad</legend>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Chip key={c.id} selected={v.cityId === c.id} onClick={() => update("cityId", c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
        </fieldset>

        {creating && (
          <Button size="lg" block disabled={!step2Ready} onClick={() => go(3)}>
            Seguir
          </Button>
        )}
      </section>

      {/* Paso 3: a quién buscás */}
      <section hidden={!show(3)} className="flex flex-col gap-6">
        {creating && (
          <div>
            <BackButton onClick={() => go(2)} />
            <h2 className="font-display text-3xl font-extrabold uppercase leading-none">¿A quién buscás?</h2>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 rounded-3xl bg-surface p-4 shadow-card">
          <div>
            <p id="spots-label" className="mb-2 text-sm font-semibold text-ink-soft">
              Faltan
            </p>
            <Stepper
              id="spots"
              label="jugadores que faltan"
              value={v.spotsNeeded}
              min={Math.max(1, confirmedCount)}
              max={v.totalPlayers - 1}
              onChange={(n) => update("spotsNeeded", n)}
            />
          </div>
          <div>
            <p id="total-label" className="mb-2 text-sm font-semibold text-ink-soft">
              De un total de
            </p>
            <Stepper
              id="total"
              label="jugadores en total"
              value={v.totalPlayers}
              min={Math.max(2, v.spotsNeeded + 1)}
              max={30}
              onChange={(n) => update("totalPlayers", n)}
            />
          </div>
          {fe.spotsNeeded && <p className="col-span-2 text-sm text-danger">{fe.spotsNeeded}</p>}
          {!creating && confirmedCount > 0 && (
            <p className="col-span-2 text-sm text-muted">
              Ya hay {confirmedCount} confirmado{confirmedCount > 1 ? "s" : ""}: no podés buscar menos lugares.
            </p>
          )}
        </div>

        {sport && (
          <LevelRangePicker
            levels={sport.levels}
            value={{ min: v.levelMin, max: v.levelMax }}
            onChange={({ min, max }) => setV((prev) => ({ ...prev, levelMin: min, levelMax: max }))}
          />
        )}
        {fe.levelMin && <p className="-mt-4 text-sm text-danger">{fe.levelMin}</p>}

        <div>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-ink-soft">Limitar por edad</span>
            <input
              type="checkbox"
              role="switch"
              checked={showAge}
              onChange={(e) => setShowAge(e.target.checked)}
              className="h-7 w-12 cursor-pointer appearance-none rounded-full bg-line transition before:ml-1 before:block before:size-5 before:rounded-full before:bg-surface before:shadow before:transition checked:bg-primary checked:before:translate-x-5"
            />
          </label>
          {showAge && (
            <div className="mt-3">
              <AgeRangePicker
                label="Rango de edad"
                value={{ min: v.ageMin, max: v.ageMax }}
                onChange={({ min, max }) => setV((prev) => ({ ...prev, ageMin: min, ageMax: max }))}
              />
            </div>
          )}
          {fe.ageMin && <p className="mt-2 text-sm text-danger">{fe.ageMin}</p>}
        </div>

        <Field
          label="Costo por persona"
          htmlFor="price"
          error={fe.price}
          hint={v.price === 0 ? "Gratis. Si se paga la cancha, poné cuánto le toca a cada uno." : undefined}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-12 items-center rounded-2xl bg-surface-2 px-4 font-semibold text-ink-soft">$</span>
            <Input
              id="price"
              name="price"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              value={Number.isNaN(v.price) ? "" : v.price}
              onChange={(e) => update("price", e.target.value === "" ? 0 : Number(e.target.value))}
              aria-invalid={Boolean(fe.price)}
            />
          </div>
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink-soft">¿Cómo se suman?</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "auto", title: "Automático", text: "Quien se anota queda adentro.", Icon: Users },
                { value: "approval", title: "Con aprobación", text: "Vos aceptás a cada uno.", Icon: UserCheck },
              ] as const
            ).map(({ value, title, text, Icon }) => {
              const active = v.acceptanceMode === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update("acceptanceMode", value)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition active:scale-[0.98]",
                    active ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-line bg-surface",
                  )}
                >
                  <Icon className={cn("mb-1 size-5", active ? "text-primary" : "text-muted")} aria-hidden />
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-ink-soft">{text}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-muted">
            Si alguien está fuera del nivel que buscás, siempre te va a pedir aprobación.
          </p>
        </fieldset>

        <Field label="Algo más" htmlFor="description" optional error={fe.description}>
          <Textarea
            id="description"
            name="description"
            maxLength={500}
            value={v.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Ej: falta un arquero, cancha techada, llevar pechera oscura."
          />
        </Field>

        <SubmitButton size="lg" variant={creating ? "accent" : "primary"} block>
          {creating ? "Publicar partido" : "Guardar cambios"}
        </SubmitButton>
      </section>
    </form>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft">
      <ArrowLeft className="size-4" /> Volver
    </button>
  );
}
