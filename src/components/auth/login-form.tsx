"use client";

import { useActionState } from "react";
import { login, type AuthFormState } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthFormState, FormData>(login, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
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
      <Field label="Contraseña" htmlFor="password" error={fe.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(fe.password)}
          required
        />
      </Field>
      <SubmitButton size="lg" block className="mt-2">
        Entrar
      </SubmitButton>
    </form>
  );
}
