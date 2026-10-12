import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { getMyProfile } from "@/lib/data/profile";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  if (!profile.isComplete) redirect("/bienvenida");

  return (
    <div className="pt-safe mx-auto min-h-dvh w-full max-w-lg pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
