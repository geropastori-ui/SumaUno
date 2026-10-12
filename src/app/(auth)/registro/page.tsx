import type { Metadata } from "next";
import Link from "next/link";
import { Divider, GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { maxBirthDate } from "@/lib/domain/age";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none">Sumate al equipo</h1>
      <p className="mt-2 text-ink-soft">
        Creá tu cuenta para anotarte en partidos o publicar el tuyo cuando te falte gente.
      </p>
      <div className="mt-6">
        <GoogleButton label="Registrarme con Google" next="/bienvenida" />
      </div>
      <Divider />
      <SignupForm maxBirthDate={maxBirthDate()} />
      <p className="mt-6 text-center text-ink-soft">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Entrá
        </Link>
      </p>
    </div>
  );
}
