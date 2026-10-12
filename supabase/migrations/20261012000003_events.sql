-- Eventos de producto para medir uso desde el primer día.
-- Los eventos de negocio (partido publicado, jugador confirmado, partido completo...)
-- los registra la propia base con triggers; el cliente solo puede registrar
-- eventos de interfaz de una lista permitida, vía track_event().

create table public.events (
  id bigint generated always as identity primary key,
  name text not null check (name ~ '^[a-z][a-z0-9_]{2,63}$'),
  profile_id uuid references public.profiles (id) on delete set null,
  -- Sin FK a propósito: el historial de eventos sobrevive aunque se borre el partido.
  match_id uuid,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_name_created_at_idx on public.events (name, created_at);
create index events_match_id_idx on public.events (match_id) where match_id is not null;

alter table public.events enable row level security;

create policy "eventos: solo admin lee" on public.events
  for select to authenticated using (public.is_platform_admin());

revoke all on public.events from anon, authenticated;
grant select on public.events to authenticated;

-- Uso interno (triggers y funciones de la base). No expuesto a clientes.
create function public.log_event(
  p_name text,
  p_profile_id uuid,
  p_match_id uuid,
  p_properties jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.events (name, profile_id, match_id, properties)
  values (p_name, p_profile_id, p_match_id, coalesce(p_properties, '{}'::jsonb));
$$;

revoke execute on function public.log_event(text, uuid, uuid, jsonb) from public, anon, authenticated;

-- Eventos de interfaz que puede registrar el cliente.
create function public.track_event(
  p_name text,
  p_match_id uuid default null,
  p_properties jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return;
  end if;
  if p_name not in (
    'filters_applied',
    'for_me_used',
    'match_viewed',
    'whatsapp_opened',
    'match_shared',
    'onboarding_completed'
  ) then
    raise exception 'Evento no permitido: %', p_name using errcode = 'invalid_parameter_value';
  end if;
  if pg_column_size(p_properties) > 2048 then
    raise exception 'Propiedades del evento demasiado grandes.' using errcode = 'invalid_parameter_value';
  end if;
  perform public.log_event(p_name, (select auth.uid()), p_match_id, p_properties);
end;
$$;

revoke execute on function public.track_event(text, uuid, jsonb) from public, anon;
grant execute on function public.track_event(text, uuid, jsonb) to authenticated;
