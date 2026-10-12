import { LogOut, MapPin, Pencil, Phone } from "lucide-react";
import type { Metadata } from "next";
import { logout } from "@/app/(auth)/actions";
import { PageHeader } from "@/components/page-header";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { SportBadge } from "@/components/sport-icon";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCities, getSports } from "@/lib/data/catalog";
import { getMyProfile } from "@/lib/data/profile";
import { levelName } from "@/lib/domain/levels";
import { formatArMobile } from "@/lib/domain/whatsapp";
import { getTheme } from "@/lib/theme";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const [profile, sports, cities, theme] = await Promise.all([
    getMyProfile(),
    getSports(),
    getCities(),
    getTheme(),
  ]);
  if (!profile) return null;
  const city = cities.find((c) => c.id === profile.cityId);
  const mySports = sports.filter((s) => profile.levels[s.id] != null);

  return (
    <>
      <PageHeader
        title="Perfil"
        action={
          <ButtonLink href="/perfil/editar" variant="secondary" size="sm" icon={<Pencil className="size-4" />}>
            Editar
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-6 px-5">
        <section className="flex flex-col items-center rounded-3xl bg-surface p-6 text-center shadow-card">
          <AvatarUploader userId={profile.id} name={profile.fullName} url={profile.avatarUrl} />
          <h2 className="font-display mt-3 text-3xl font-bold uppercase leading-none">{profile.fullName}</h2>
          <p className="mt-1 flex items-center gap-1 text-ink-soft">
            {profile.age} años
            {city && (
              <>
                <span aria-hidden>·</span>
                <MapPin className="size-4" aria-hidden /> {city.name}
              </>
            )}
          </p>
          {profile.whatsapp && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <Phone className="size-3.5" aria-hidden /> {formatArMobile(profile.whatsapp)} · privado
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display mb-2 text-xl font-bold uppercase text-ink-soft">Tus deportes</h2>
          <ul className="flex flex-col gap-2">
            {mySports.map((sport) => (
              <li key={sport.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-card">
                <SportBadge icon={sport.icon} size={40} />
                <span className="flex-1 font-semibold">{sport.name}</span>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
                  {levelName(sport.levels, profile.levels[sport.id])}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display mb-2 text-xl font-bold uppercase text-ink-soft">Apariencia</h2>
          <ThemeSwitcher initial={theme} />
        </section>

        <form action={logout}>
          <SubmitButton variant="ghost" block icon={<LogOut className="size-4" />}>
            Cerrar sesión
          </SubmitButton>
        </form>
      </div>
    </>
  );
}
