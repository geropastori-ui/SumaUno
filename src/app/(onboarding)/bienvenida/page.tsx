import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { getCities, getSports } from "@/lib/data/catalog";
import { getMyProfile } from "@/lib/data/profile";
import { maxBirthDate } from "@/lib/domain/age";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Bienvenida" };

export default async function WelcomePage({ searchParams }: PageProps<"/bienvenida">) {
  const [profile, sports, cities, { next }] = await Promise.all([
    getMyProfile(),
    getSports(),
    getCities(),
    searchParams,
  ]);
  if (!profile) redirect("/login");
  const nextPath = safeNext(next);
  if (profile.isComplete) redirect(nextPath as "/explorar");

  return (
    <div className="animate-fade-in">
      <ProfileForm
        mode="onboarding"
        next={nextPath}
        sports={sports}
        cities={cities}
        maxBirthDate={maxBirthDate()}
        initial={{
          fullName: profile.fullName,
          birthDate: profile.birthDate,
          cityId: profile.cityId,
          whatsapp: profile.whatsapp,
          levels: profile.levels,
        }}
      />
    </div>
  );
}
