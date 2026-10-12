import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SumáUno · Completá tu partido",
    short_name: "SumáUno",
    description: "Publicá tu partido y sumá jugadores de tu zona. Fútbol 5, pádel y básquet.",
    lang: "es-AR",
    start_url: "/explorar",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f3ec",
    theme_color: "#0b6b3a",
    categories: ["sports", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Publicar partido", url: "/publicar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Mis partidos", url: "/mis-partidos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
