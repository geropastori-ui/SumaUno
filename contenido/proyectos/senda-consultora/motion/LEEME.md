# Motion graphics – Senda Consultora

Videos hechos con **HyperFrames** (HeyGen): cada video es un HTML animado con GSAP que se renderiza a MP4.

| Reel | Proyecto | Video |
|---|---|---|
| #5 · Por qué existe Senda | `reel-05-por-que-existe-senda/` | `senda-reel-05-por-que-existe-senda-con-voz.mp4` (1080×1920, 30 fps, 41 s, con voz) |

## Reel #5 · Sincronización con la voz de Gero
Video con voz: `senda-reel-05-por-que-existe-senda-con-voz.mp4`. Los audios están en `reel-05-por-que-existe-senda/assets/voz/` y se montan en `index.html` como `<audio>` con su `data-start`.

| Audio | Entra en | Habla | Escena |
|---|---|---|---|
| 1.1 | 0:00 (recortado desde 0,6 s) | 0:00,2–0:03 | "Si tu pyme no crece… No es falta de clientes." |
| 1.2 | 0:02,6 | 0:03,5–0:06,9 | Todo converge en el DUEÑO |
| 1.3 | 0:06,4 | 0:07,4–0:12,7 | Números (0:07,2) → herramientas y caos (0:09,2) |
| 1.4 | 0:11,4 | 0:13,2–0:19,5 | "01 · Primer video de Senda" → "No tenés que resolverlo solo." (0:17,7) |
| 1.5 | 0:19,1 | 0:20–0:26,7 | "Por eso creamos Senda." + pilares: Estrategia 0:23 · Finanzas 0:23,9 · Procesos 0:24,9 · Marketing 0:26 |
| 1.6 | 0:26,4 | 0:27,4–0:30,6 | "Crecer no es correr más." → "Es tener un camino claro." (0:29,3) |
| — | — | 0:30,6–0:33 | La S se dibuja y aparece el logo (sin voz) |
| 1.7 | 0:32,5 | 0:33–0:40 | "Diagnóstico gratuito" (0:33,4) → "Agendá tu consulta" (0:37) → "Seguinos" (0:39) |

Duración final: **41 s**. Audio normalizado después del render: -14,7 LUFS medidos, pico -0,9 dBFS (Instagram apunta a ~-14).

Guion de referencia: `reel-05-guion-voz.md`.

## Editar y volver a renderizar
Requiere Node 22+ y FFmpeg.
```bash
cd reel-05-por-que-existe-senda
npx hyperframes@0.8.172 preview   # vista previa en el navegador
npx hyperframes@0.8.172 render -f 30 -q high -o ../senda-reel-05-por-que-existe-senda.mp4
```
Textos, colores y tiempos están en `index.html` (los tiempos de cada escena en `data-start` / `data-duration`, las animaciones en el `<script>` del final). Las fuentes Red Hat (licencia OFL) y GSAP están incluidas en `assets/`, así que no depende de internet.
