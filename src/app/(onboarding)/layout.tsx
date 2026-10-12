import { Logo } from "@/components/logo";

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="pt-safe mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
      <header className="py-6">
        <Logo />
      </header>
      <main className="flex-1 pb-10">{children}</main>
    </div>
  );
}
