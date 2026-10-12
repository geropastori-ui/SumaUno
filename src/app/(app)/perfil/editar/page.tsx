import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/profile/profile-form";
import { getCities, getSports } from "@/lib/data/catalog";
import { getMyProfile } from "@/lib/data/profile";
import { maxBirthDate } from "@/lib/domain/age";

export const metadata: Metadata = { title: "Editar perfil" };

export default async function EditProfilePage() {
  const [profile, sports, cities] = await Promise.all([getMyProfile(), getSports(), getCities()]);
  if (!profile) return null;

  return (
    <div className="px-5 pt-4">
      <Link href="/perfil" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft">
        <ArrowLeft className="size-4" /> Perfil
      </Link>
      <h1 className="font-display mb-4 mt-3 text-4xl font-extrabold uppercase leading-none">Editar perfil</h1>
      <ProfileForm
        mode="edit"
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
