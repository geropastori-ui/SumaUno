-- Métricas básicas de producto y tareas programadas.

-- Partidos publicados, completados y tiempo hasta completar, por día, deporte y ciudad.
-- security_invoker: respeta RLS. Solo la plataforma (o el service role) las consulta.
create view public.metrics_matches_daily
with (security_invoker = true)
as
select
  (m.created_at at time zone 'America/Argentina/Buenos_Aires')::date as day,
  s.slug as sport,
  c.slug as city,
  count(*) as published,
  count(*) filter (where m.filled_at is not null) as filled,
  count(*) filter (where m.status = 'cancelled') as cancelled,
  round(avg(extract(epoch from m.filled_at - m.created_at) / 60)
    filter (where m.filled_at is not null)) as avg_minutes_to_fill,
  percentile_cont(0.5) within group (order by extract(epoch from m.filled_at - m.created_at) / 60)
    filter (where m.filled_at is not null) as median_minutes_to_fill
from public.matches m
join public.sports s on s.id = m.sport_id
join public.cities c on c.id = m.city_id
group by 1, 2, 3;

create view public.metrics_events_daily
with (security_invoker = true)
as
select
  (created_at at time zone 'America/Argentina/Buenos_Aires')::date as day,
  name,
  count(*) as total,
  count(distinct profile_id) as unique_users
from public.events
group by 1, 2;

revoke all on public.metrics_matches_daily, public.metrics_events_daily from anon, authenticated;

-- Archivado automático de partidos pasados cada 15 minutos (pg_cron viene en Supabase).
-- Igual las consultas filtran por fecha, así que la app se comporta bien aunque el job se atrase.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'finish-past-matches',
  '*/15 * * * *',
  $$select public.finish_past_matches()$$
);
