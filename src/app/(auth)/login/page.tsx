import type { Metadata } from "next";
import Link from "next/link";
import { Divider, GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  google: "No pudimos conectar con Google. Probá de nuevo.",
  callback: "El link expiró o ya se usó. Iniciá sesión de nuevo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const errorMsg = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-4xl font-extrabold uppercase leading-none">¿Jugamos?</h1>
      <p className="mt-2 text-ink-soft">Entrá para ver los partidos que buscan jugadores cerca tuyo.</p>
      {errorMsg && (
        <Alert tone="error" className="mt-4">
          {errorMsg}
        </Alert>
      )}
      <div className="mt-6">
        <GoogleButton next={nextPath} />
      </div>
      <Divider />
      <LoginForm next={nextPath} />
      <p className="mt-6 text-center text-ink-soft">
        ¿No tenés cuenta?{" "}
        <Link
          href={nextPath ? `/registro?next=${encodeURIComponent(nextPath)}` : "/registro"}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Creala gratis
        </Link>
      </p>
    </div>
  );
}
