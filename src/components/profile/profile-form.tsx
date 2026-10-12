"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useActionState, useState } from "react";
import { saveProfile, type ProfileFormState } from "@/lib/actions/profile";
import type { City, Sport } from "@/lib/data/catalog";
import { cn } from "@/lib/cn";
import { formatArMobile } from "@/lib/domain/whatsapp";
import { SportBadge } from "@/components/sport-icon";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { LevelPicker } from "./level-picker";

type Initial = {
  fullName: string;
  birthDate: string | null;
  cityId: string | null;
  whatsapp: string | null;
  levels: Record<string, number>;
};

type Props = {
  mode: "onboarding" | "edit";
  initial: Initial;
  sports: Sport[];
  cities: City[];
  maxBirthDate: string;
  next?: string;
};

export function ProfileForm({ mode, initial, sports, cities, maxBirthDate, next }: Props) {
  const [state, action] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  const [step, setStep] = useState<1 | 2>(1);
  const [cityId, setCityId] = useState(initial.cityId ?? (cities.length === 1 ? cities[0].id : ""));
  const [levels, setLevels] = useState<Record<string, number>>(initial.levels);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(initial.levels).map((id) => [id, true])),
  );
  const [stepError, setStepError] = useState<string | null>(null);
  const fe = state.fieldErrors ?? {};
  const onboarding = mode === "onboarding";

  const chosen = Object.fromEntries(
    Object.entries(levels).filter(([sportId]) => enabled[sportId]),
  );
  const missingLevel = sports.some((s) => enabled[s.id] && !levels[s.id]);

  function goToSports(form: HTMLFormElement | null) {
    if (!form) return;
    const fields = ["fullName", "birthDate", "whatsapp"]
      .map((name) => form.elements.namedItem(name))
      .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement);
    const invalid = fields.find((el) => !el.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    if (!cityId) {
      setStepError("Elegí tu ciudad.");
      return;
    }
    setStepError(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const showPersonal = !onboarding || step === 1;
  const showSports = !onboarding || step === 2;
  // Si el server marca error en un campo del paso 1, volvemos a mostrarlo.
  const personalError = Boolean(fe.fullName || fe.birthDate || fe.cityId || fe.whatsapp);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="mode" value={mode} />
      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="cityId" value={cityId} />
      <input type="hidden" name="sports" value={JSON.stringify(chosen)} />

      {onboarding && (
        <div className="flex items-center gap-2" aria-label={`Paso ${step} de 2`}>
          {[1, 2].map((n) => (
            <span
              key={n}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", n <= step ? "bg-primary" : "bg-line")}
            />
          ))}
        </div>
      )}

      {state.error && <Alert tone="error">{state.error}</Alert>}

      <section hidden={!showPersonal && !personalError} className="flex flex-col gap-5">
        {onboarding && (
          <div>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-none">Armemos tu ficha</h1>
            <p className="mt-2 text-ink-soft">
              Con esto los organizadores saben quién se suma. Tu WhatsApp queda privado hasta que te
              confirmen en un partido.
            </p>
          </div>
        )}
        {!onboarding && <h2 className="font-display text-2xl font-bold uppercase">Tus datos</h2>}

        <Field label="Nombre y apellido" htmlFor="fullName" error={fe.fullName}>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            defaultValue={initial.fullName}
            minLength={2}
            maxLength={80}
            aria-invalid={Boolean(fe.fullName)}
            required
          />
        </Field>

        <Field
          label="Fecha de nacimiento"
          htmlFor="birthDate"
          error={fe.birthDate}
          hint="Los demás solo ven tu edad."
        >
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            min="1920-01-01"
            max={maxBirthDate}
            defaultValue={initial.birthDate ?? undefined}
            aria-invalid={Boolean(fe.birthDate)}
            required
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-ink-soft">¿Dónde jugás?</legend>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Chip key={c.id} selected={cityId === c.id} onClick={() => setCityId(c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
          {(fe.cityId || stepError) && (
            <p role="alert" className="text-sm text-danger">
              {fe.cityId ?? stepError}
            </p>
          )}
        </fieldset>

        <Field
          label="WhatsApp"
          htmlFor="whatsapp"
          error={fe.whatsapp}
          hint="Código de área sin el 0 y número sin el 15. Solo lo ven el organizador y los confirmados de tus partidos."
        >
          <div className="flex items-center gap-2">
            <span className="flex h-12 shrink-0 items-center whitespace-nowrap rounded-2xl bg-surface-2 px-3 text-sm font-semibold text-ink-soft">
              +54 9
            </span>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="342 412-3456"
              defaultValue={initial.whatsapp ? formatArMobile(initial.whatsapp) : undefined}
              pattern="[0-9 \-]{10,14}"
              aria-invalid={Boolean(fe.whatsapp)}
              required
            />
          </div>
        </Field>

        {onboarding && (
          <Button size="lg" block onClick={(e) => goToSports(e.currentTarget.form)}>
            Seguir
          </Button>
        )}
      </section>

      <section hidden={!showSports} className="flex flex-col gap-4">
        {onboarding ? (
          <div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-soft"
            >
              <ArrowLeft className="size-4" /> Volver
            </button>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-none">¿Qué jugás?</h1>
            <p className="mt-2 text-ink-soft">
              Elegí tus deportes y tu nivel real: así te mostramos partidos parejos.
            </p>
          </div>
        ) : (
          <h2 className="font-display mt-2 text-2xl font-bold uppercase">Tus deportes</h2>
        )}

        {sports.map((sport) => {
          const on = Boolean(enabled[sport.id]);
          return (
            <div
              key={sport.id}
              className={cn(
                "rounded-3xl border bg-surface p-4 transition",
                on ? "border-primary shadow-card" : "border-line",
              )}
            >
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setEnabled((prev) => ({ ...prev, [sport.id]: !on }))}
                className="flex w-full items-center gap-3 text-left"
              >
                <SportBadge icon={sport.icon} />
                <span className="font-display flex-1 text-2xl font-bold uppercase">{sport.name}</span>
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full border-2 transition",
                    on ? "border-primary bg-primary text-primary-ink" : "border-line",
                  )}
                >
                  {on && <Check className="size-4" strokeWidth={3} />}
                </span>
              </button>
              {on && (
                <LevelPicker
                  name={sport.name}
                  levels={sport.levels}
                  value={levels[sport.id] ?? null}
                  onChange={(rank) => setLevels((prev) => ({ ...prev, [sport.id]: rank }))}
                />
              )}
            </div>
          );
        })}
        {fe.sports && (
          <p role="alert" className="text-sm text-danger">
            {fe.sports}
          </p>
        )}

        <SubmitButton
          size="lg"
          block
          disabled={Object.keys(chosen).length === 0 || missingLevel}
          className="mt-2"
        >
          {onboarding ? "¡Listo, a jugar!" : "Guardar cambios"}
        </SubmitButton>
        {missingLevel && <p className="text-center text-sm text-muted">Elegí tu nivel en cada deporte.</p>}
      </section>
    </form>
  );
}
