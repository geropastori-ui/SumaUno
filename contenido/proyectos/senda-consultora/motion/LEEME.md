# Motion graphics – Senda Consultora

Videos hechos con **HyperFrames** (HeyGen): cada video es un HTML animado con GSAP que se renderiza a MP4.

| Reel | Proyecto | Video |
|---|---|---|
| #5 · Por qué existe Senda | `reel-05-por-que-existe-senda/` | `senda-reel-05-por-que-existe-senda.mp4` (1080×1920, 30 fps, 40 s, sin audio) |

## Reel #5 · Hoja de tiempos para grabar la voz en off
Guion completo para grabar (con ganchos alternativos y tips): `reel-05-guion-voz.md`.

Grabá cada frase para que **empiece** en el segundo indicado (en CapCut alcanza con correr el clip de audio). Si una frase te queda más larga, avisame y estiro esa escena.

| Desde | Hasta | Escena en pantalla | Voz en off |
|---|---|---|---|
| 0:00 | 0:04 | "Si tu pyme no crece… No es falta de clientes." | "Si tu pyme no crece, el problema no son los clientes." |
| 0:04 | 0:08 | Diagrama: todo converge en el DUEÑO | "Se estancan porque todo pasa por el dueño," |
| 0:08 | 0:11,5 | Barras con signos de pregunta | "los números no están claros" |
| 0:11,5 | 0:15 | Apps que caen y se apilan | "y cada herramienta nueva suma más caos." |
| 0:15 | 0:22 | "Trabajando con pymes" → "Lo vi una y otra vez." | "Yo [tu experiencia] y lo vi una y otra vez." (la frase "lo vi" aparece en 0:17,6) |
| 0:22 | 0:27,4 | "Por eso armé Senda." + 4 pilares | "Por eso armé Senda: para ayudar a las pymes a ordenar su estrategia, sus números, sus procesos y su marketing." |
| 0:27,4 | 0:32 | El camino en forma de S + "Crecer no es correr más. Es tener un camino claro." | "Porque crecer no es correr más: es tener un camino claro." ("Es tener…" aparece en 0:29,4) |
| 0:32 | 0:40 | La S se dibuja → logo → "Diagnóstico gratuito / Escribime por DM" | "Empezamos siempre con un diagnóstico gratuito. Si sentís que todo pasa por vos, escribime." |

**Mezcla sugerida:** voz a -14 LUFS aprox. + música instrumental suave de la biblioteca de Instagram al 10–15 %.

## Editar y volver a renderizar
Requiere Node 22+ y FFmpeg.
```bash
cd reel-05-por-que-existe-senda
npx hyperframes@0.8.172 preview   # vista previa en el navegador
npx hyperframes@0.8.172 render -f 30 -q high -o ../senda-reel-05-por-que-existe-senda.mp4
```
Textos, colores y tiempos están en `index.html` (los tiempos de cada escena en `data-start` / `data-duration`, las animaciones en el `<script>` del final). Las fuentes Red Hat (licencia OFL) y GSAP están incluidas en `assets/`, así que no depende de internet.
