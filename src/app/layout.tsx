import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { getTheme } from "@/lib/theme";
import "./globals.css";

const display = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "SumáUno", template: "%s · SumáUno" },
  description:
    "¿Te falta uno para el partido? Publicalo y sumá jugadores de tu zona. Fútbol 5, pádel y básquet.",
  applicationName: "SumáUno",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0b110e" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getTheme();
  return (
    <html
      lang="es-AR"
      className={`${display.variable} ${sans.variable} ${theme === "system" ? "" : theme}`}
    >
      <body>{children}</body>
    </html>
  );
}
