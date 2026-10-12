"use client";

import { useActionState } from "react";
import { signup, type AuthFormState } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignupForm({ maxBirthDate }: { maxBirthDate: string }) {
  const [state, action] = useActionState<AuthFormState, FormData>(signup, {});
  const fe = state.fieldErrors ?? {};

  if (state.info) {
    return (
      <Alert tone="ok" className="text-base">
        {state.info} Abrí el link desde este mismo dispositivo para seguir.
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Nombre y apellido" htmlFor="fullName" error={fe.fullName}>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={state.values?.fullName}
          aria-invalid={Boolean(fe.fullName)}
          required
        />
      </Field>
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(fe.email)}
          required
        />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={fe.password} hint="Mínimo 8 caracteres.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          aria-invalid={Boolean(fe.password)}
          required
        />
      </Field>
      <Field
        label="Fecha de nacimiento"
        htmlFor="birthDate"
        error={fe.birthDate}
        hint="Por ahora SumáUno es para mayores de 18. Los demás solo ven tu edad."
      >
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          max={maxBirthDate}
          min="1920-01-01"
          defaultValue={state.values?.birthDate}
          aria-invalid={Boolean(fe.birthDate)}
          required
        />
      </Field>
      <SubmitButton size="lg" block className="mt-2">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
