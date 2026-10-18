# Motion graphics – Senda Consultora

Videos hechos con **HyperFrames** (HeyGen): cada video es un HTML animado con GSAP que se renderiza a MP4.

| Reel | Proyecto | Video |
|---|---|---|
| #5 · Por qué existe Senda | `reel-05-por-que-existe-senda/` | `senda-reel-05-por-que-existe-senda-con-voz.mp4` (1080×1920, 30 fps, 28,5 s, voz original) |

## Reel #5 · Sincronización con la voz de Gero
Video con voz: `senda-reel-05-por-que-existe-senda-con-voz.mp4`. Los audios están en `reel-05-por-que-existe-senda/assets/voz/` y se montan en `index.html` como `<audio>` con su `data-start`.

**Versión actual (v5 · 28,5 s):**
- **Voz:** la voz original de Gero (sin cambio de tono). `voz-1.N-limpia.m4a` (sin respiraciones + procesado de locución) → `voz-1.N-final.m4a` con `rubberband` solo para la velocidad ×1,2, conservando tono y formantes.
- **Video:** los tiempos en `index.html` están escritos a velocidad original y se escalan con `K = 1/1,2` (`at()` y `d()` en el script); los `data-start` ya están escalados.
- **Sin pausa en el logo:** la voz del cierre (1.7) arranca mientras la S se dibuja.
- **Textos dinámicos:** cada título se separa en palabras que entran con rebote, zoom y desenfoque; golpe de escala en la palabra naranja; salidas rápidas con desenfoque; zoom lento de cámara en cada escena.

Tiempos de la versión anterior (velocidad normal; dividir por 1,15 para la actual):

| Audio | Entra en | Habla | Escena |
|---|---|---|---|
| 1.1 | 0:00 (desde 0,6 s del archivo) | 0:00,2–0:03,2 | "Si tu pyme no crece… No es falta de clientes." |
| 1.2 | 0:02,6 | 0:03,5–0:07 | Todo converge en el DUEÑO |
| 1.3 | 0:06,4 | 0:07,4–0:12,7 | Números (0:07,2) → herramientas y caos (0:09,2) |
| 1.4 | 0:13 (solo desde 6,2 s del archivo) | 0:13,2–0:14,8 | "No tenés que resolverlo solo." (se cortó "Este es el primer video de Senda, y arranco con una idea simple") |
| 1.5 | 0:14,5 | 0:15,5–0:22,1 | "Por eso creamos Senda." + pilares: Estrategia 0:18,4 · Finanzas 0:19,3 · Procesos 0:20,3 · Marketing 0:21,4 |
| 1.6 | 0:21,8 | 0:22,8–0:26 | "Crecer no es correr más." → "Es tener un camino claro." (0:24,7) |
| — | — | 0:26–0:28,4 | La S se dibuja y aparece el logo (sin voz) |
| 1.7 | 0:27,9 | 0:28,4–0:35,6 | "Diagnóstico gratuito" (0:28,8) → "Agendá tu consulta" (0:32,4) → "Seguinos" (0:34,4) |

Duración final: **36,4 s**. Fondo liso Pizarra (sin degradé).

**Voz procesada** (`assets/voz/voz-1.N-limpia.m4a`, generadas desde los originales `voz-1.N.m4a`): se silencian respiraciones y ruidos entre frases (con fundidos de 20 ms para que no se noten cortes) y se aplica filtro de graves, reducción de ruido, EQ (menos "barro" en 250 Hz, más presencia en 3,5 kHz), de-esser y compresión suave. El tono y la entonación no se modifican. Mezcla final normalizada: -14,5 LUFS, pico -1,4 dBFS.

Guion de referencia: `reel-05-guion-voz.md`.

## Editar y volver a renderizar
Requiere Node 22+ y FFmpeg.
```bash
cd reel-05-por-que-existe-senda
npx hyperframes@0.8.172 preview   # vista previa en el navegador
npx hyperframes@0.8.172 render -f 30 -q high -o ../senda-reel-05-por-que-existe-senda.mp4
```
Textos, colores y tiempos están en `index.html` (los tiempos de cada escena en `data-start` / `data-duration`, las animaciones en el `<script>` del final). Las fuentes Red Hat (licencia OFL) y GSAP están incluidas en `assets/`, así que no depende de internet.
