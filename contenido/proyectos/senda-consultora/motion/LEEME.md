# Motion graphics – Senda Consultora

Videos hechos con **HyperFrames** (HeyGen): cada video es un HTML animado con GSAP que se renderiza a MP4.

| Reel | Proyecto | Video |
|---|---|---|
| #5 · Por qué existe Senda | `reel-05-por-que-existe-senda/` | `senda-reel-05-por-que-existe-senda-con-voz.mp4` (1080×1920, 30 fps, 40 s, con voz) |

## Reel #5 · Sincronización con la voz de Gero
Video con voz: `senda-reel-05-por-que-existe-senda-con-voz.mp4`. Los audios están en `reel-05-por-que-existe-senda/assets/voz/` y se montan en `index.html` como `<audio>` con su `data-start`.

| Audio | Entra en | Habla | Escena |
|---|---|---|---|
| 1.1 · Gancho | **pendiente** | 0:00–0:04 | "Si tu pyme no crece… No es falta de clientes." |
| 1.2 | 0:03,5 | 0:04,4–0:07,8 | Todo converge en el DUEÑO |
| 1.3 | 0:07,3 | 0:08,3–0:13,6 | Números (0:08,1) → herramientas y caos (0:10,1) |
| 1.4 | 0:12,3 | 0:14,1–0:20,4 | "01 · Primer video de Senda" → "No tenés que resolverlo solo." (0:18,6) |
| 1.5 | 0:20,0 | 0:20,9–0:27,5 | "Por eso creamos Senda." + pilares al decirlos: Estrategia 0:23,9 · Finanzas 0:24,8 · Procesos 0:25,8 · Marketing 0:26,9 |
| 1.6 | 0:27,3 | 0:28,3–0:31,4 | "Crecer no es correr más." → "Es tener un camino claro." (0:30,2) |
| 1.7 · Cierre / CTA | **pendiente** | 0:32–0:40 | Logo → "Diagnóstico gratuito / Escribime por DM" |

Guion de referencia: `reel-05-guion-voz.md`.

## Editar y volver a renderizar
Requiere Node 22+ y FFmpeg.
```bash
cd reel-05-por-que-existe-senda
npx hyperframes@0.8.172 preview   # vista previa en el navegador
npx hyperframes@0.8.172 render -f 30 -q high -o ../senda-reel-05-por-que-existe-senda.mp4
```
Textos, colores y tiempos están en `index.html` (los tiempos de cada escena en `data-start` / `data-duration`, las animaciones en el `<script>` del final). Las fuentes Red Hat (licencia OFL) y GSAP están incluidas en `assets/`, así que no depende de internet.
