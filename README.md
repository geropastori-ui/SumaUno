# SumáUno

App web mobile-first (PWA) para deportistas amateurs que necesitan completar un turno. Publicás tu partido diciendo cuántos faltan y otros jugadores de tu zona se anotan. "Deportistas que buscan deportistas".

El MVP incluye fútbol 5, pádel y básquet 3x3, con lanzamiento en Santa Fe. Ciudades y deportes se cargan en la base, sin tocar código.

## Stack

- **Next.js 16** (App Router, Server Actions) + **TypeScript** estricto + **Tailwind CSS v4**.
- **Supabase**:
  - Auth con email/contraseña y Google.
  - Postgres con RLS en todas las tablas.
  - Realtime para el detalle de partido.
  - Storage para las fotos de perfil.
- **Zod** para validar formularios, **Vitest** para la lógica de dominio y **pgTAP** para la base.
- Deploy pensado para **Vercel**.

## Requisitos

- Node.js 20.9+ (probado con 22).
- Docker, solo para levantar Supabase en local.

## Levantar en local

```bash
npm install
npm run db:start          # levanta Supabase en Docker y aplica migraciones + seed
cp .env.example .env.local
```

Completá `.env.local` con lo que imprime `npx supabase status`:

| Variable | Para qué | Valor en local |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto | `API_URL` (http://127.0.0.1:54321) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (publishable / anon) | `PUBLISHABLE_KEY` |
| `NEXT_PUBLIC_SITE_URL` | URL de la app (redirects de auth) | http://localhost:3000 |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo scripts locales. Nunca en el cliente | `SECRET_KEY` |
| `SUPABASE_AUTH_GOOGLE_CLIENT_ID` / `_SECRET` | Google OAuth en local (opcional) | Desde Google Cloud Console |

```bash
npm run dev               # http://localhost:3000
```

### Usuarios de prueba (solo local)

El seed (`supabase/seed.sql`) crea 6 jugadores y 6 partidos de ejemplo en Santa Fe:

- Usuarios: `lucia@`, `martin@`, `sofia@`, `diego@`, `juli@` y `cami@demo.sumauno.app`.
- Contraseña de todos: `demo-sumauno`.
- Los teléfonos son ficticios.

Nunca corras el seed en producción.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run check` | Lint + type-check + tests + build |
| `npm run lint` / `typecheck` / `test` | Cada chequeo por separado |
| `npm run db:start` | Levanta Supabase local |
| `npm run db:reset` | Recrea la base local desde las migraciones y corre el seed |
| `npm run db:test` | Tests pgTAP de RLS y reglas de negocio, más el test de concurrencia |
| `npm run db:types` | Regenera `src/types/database.ts` desde la base local |
| `npm run db:push` | Aplica las migraciones pendientes al proyecto remoto vinculado |

## Migraciones y deploy

Las migraciones están versionadas en `supabase/migrations/`:

1. `…01_catalog`: ciudades, deportes y escalas de nivel (con los datos iniciales).
2. `…02_profiles`:
   - Perfiles, datos privados (`profile_private`) y deportes del jugador.
   - Validación +18.
   - Bucket de avatares.
3. `…03_events`: tabla `events` y `track_event()` para métricas de producto.
4. `…04_phase2_clubs`: clubes, sedes, canchas, turnos y reservas. Es la Fase 2: solo esquema y RLS.
5. `…05_matches`: partidos, inscripciones, funciones de cupos y búsqueda.
6. `…06_metrics_and_jobs`: vistas de métricas y archivado automático con `pg_cron`.
7. `…07_realtime`: publica partidos e inscripciones en Realtime.

### Primer deploy

1. Creá un proyecto en [supabase.com](https://supabase.com). Región sugerida: São Paulo.
2. Vinculalo y subí las migraciones:
   ```bash
   npx supabase login
   npx supabase link --project-ref <tu-project-ref>
   npm run db:push
   ```
3. En el dashboard de Supabase:
   - **Database → Extensions:** verificá que `pg_cron` quede habilitada. La migración la crea.
   - **Auth → URL Configuration:**
     - Site URL: tu dominio.
     - Redirect URLs: `https://tu-dominio/auth/callback`. Sumá también los dominios de preview de Vercel si los usás.
   - **Auth → Providers → Google:** pegá Client ID y Secret de Google Cloud. En Google, el redirect autorizado es `https://<project-ref>.supabase.co/auth/v1/callback`.
   - **Auth → Providers → Email:** dejá la confirmación de email activada. El link de confirmación vuelve a `/auth/callback`.
4. En Vercel, importá el repo y cargá `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SITE_URL`.

## Cómo está armado

```
src/
  app/
    (auth)/          login, registro y server actions de auth
    (onboarding)/    bienvenida: completar perfil
    (app)/           explorar, publicar, partidos/[id], mis-partidos, perfil (con navegación inferior)
    auth/callback    vuelta de Google y de la confirmación de email
    manifest.ts      PWA (más public/sw.js y /offline)
  components/        ui/ (botones, chips, bottom sheet…), match/, explore/, profile/
  lib/
    domain/          lógica pura y testeada: edad, compatibilidad, fechas AR, filtros, WhatsApp
    data/            lecturas del servidor (data access layer)
    actions/         server actions (mutaciones validadas con Zod)
    supabase/        clientes para navegador, servidor y proxy
supabase/
  migrations/        esquema versionado
  tests/database/    tests pgTAP
  seed.sql           datos de ejemplo (solo local)
scripts/             test de concurrencia
```

### Decisiones importantes

- **Los cupos los calcula la base.** Anotarse, bajarse, aprobar, rechazar, quitar, cerrar y cancelar se hacen solo con funciones RPC (`join_match`, `leave_match`, `respond_to_request`, `remove_participant` y `set_match_status`).
  - Cada función bloquea la fila del partido (`SELECT … FOR UPDATE`), así dos personas no pueden tomar el último lugar a la vez. Lo prueba `scripts/test-concurrency.sh`.
  - Los privilegios por columna impiden que el cliente toque `status`, `spots_left` o `featured_until`.
- **Privacidad.** RLS filtra filas, no columnas. Por eso la fecha de nacimiento y el WhatsApp viven en `profile_private`, que solo lee su dueño.
  - El WhatsApp se comparte con `get_match_contacts()`: el organizador ve el de sus confirmados y cada confirmado ve el del organizador.
  - La edad pública sale de `profile_age()`.
- **Reglas de compatibilidad.**
  - Fuera del rango de edad no te podés anotar.
  - Fuera del rango de nivel, o sin nivel cargado en ese deporte, la solicitud queda pendiente aunque el partido sea automático.
  - La regla está en la base (`join_match`) y espejada en `src/lib/domain/compatibility.ts` para la interfaz.
- **Niveles comparables.** Cada deporte define su escala en `sport_levels`. El campo `rank` (mayor = mejor) permite filtrar por rango.
- **Métricas desde el día uno.**
  - Triggers en la base registran en `events` los partidos publicados, las inscripciones, los partidos completos (con `seconds_to_fill`) y los cambios de estado.
  - El cliente registra eventos de interfaz de una lista permitida: filtros, "Para mí", WhatsApp y compartir.
  - Vistas: `metrics_matches_daily` (publicados, completados, tiempo hasta completar) y `metrics_events_daily`.
- **Archivado.** `pg_cron` pasa a `finished` los partidos que empezaron hace más de 2 horas. Las consultas también filtran por fecha, así que la app se comporta bien aunque el job se atrase.
- **Zona horaria.** Todo se guarda en UTC y se muestra en `America/Argentina/Buenos_Aires` (UTC−3 fijo).
- **Cache Components de Next.js está apagado.** Casi todas las pantallas dependen de la sesión y se renderizan por request.

### Previsto, sin implementar

- `matches.featured_until` para destacar partidos (la búsqueda ya los ordena primero) y `profiles.membership_tier` para membresías.
- Roles `player`, `club_admin` y `platform_admin`, más `club_members` con RLS por club, para la Fase 2.
- Tablas de la Fase 2 y `matches.booking_id`, para vincular un partido con un turno reservado.
- `club_payment_accounts`, preparada para Mercado Pago marketplace. Los tokens no se guardan ahí.
- Notificaciones, geolocalización (`venues` ya tiene lat/lng), chat y reputación.
