# SumáUno

App web mobile-first (PWA) para deportistas amateurs que necesitan completar un turno: publicás el partido, decís cuántos faltan y la gente de tu zona se suma. MVP: fútbol 5, pádel y básquet/3x3, lanzamiento en Santa Fe.

## Stack

- Next.js 16 (App Router) + TypeScript estricto + Tailwind CSS v4
- Supabase: Auth (email/contraseña y Google), Postgres con RLS, Storage para avatares
- Deploy pensado para Vercel

## Requisitos

- Node.js 20.9+ (probado con 22)
- Docker (solo para levantar Supabase en local)

## Levantar en local

```bash
npm install
npm run db:start          # levanta Supabase local en Docker, aplica migraciones y seed
cp .env.example .env.local
```

Completá `.env.local` con lo que imprime `npx supabase status`:

| Variable | Valor en local |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `API_URL` (http://127.0.0.1:54321) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY` |
| `NEXT_PUBLIC_SITE_URL` | http://localhost:3000 |
| `SUPABASE_SERVICE_ROLE_KEY` | `SECRET_KEY` (no se usa en la app, solo scripts) |

```bash
npm run dev               # http://localhost:3000
```

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run check` | Lint + type-check + tests + build |
| `npm run db:reset` | Recrea la base local desde las migraciones y corre `supabase/seed.sql` |
| `npm run db:types` | Regenera `src/types/database.ts` desde la base local |
| `npm run db:push` | Aplica las migraciones pendientes al proyecto remoto vinculado |
