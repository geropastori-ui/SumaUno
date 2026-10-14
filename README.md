# SumaUno
App deportiva nexo de diversos jugadores de diferentes deportes para poder unirse y jugar cuando haga falta un jugador mas

## Agente creador de contenido

En `.claude/skills/creador-contenido/` hay un agente de Claude Code que propone ideas
de contenido, espera tu aprobación, escribe el guion y lo adapta a cada plataforma.

```
/creador-contenido sumauno
/creador-contenido <otro-proyecto> tiktok,linkedin 3
```

Cada proyecto vive en `contenido/proyectos/<proyecto>/`:
- `brief.md`: público, tono, pilares y plataformas (completá los `[DATO]`).
- `ideas/`: tandas de ideas con su estado (PROPUESTA / APROBADA / DESCARTADA).
- `guiones/`: guion maestro + adaptaciones por plataforma.
