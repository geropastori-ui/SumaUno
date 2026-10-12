import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="pt-safe mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
      <header className="py-6">
        <Link href="/" aria-label="SumáUno, inicio">
          <Logo />
        </Link>
      </header>
      <main className="flex-1 pb-10">{children}</main>
    </div>
  );
}
