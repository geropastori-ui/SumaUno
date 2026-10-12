-- Partidos e inscripciones.
--
-- Regla de oro: los cupos los calcula la base. Toda acción de inscripción pasa
-- por funciones RPC que bloquean la fila del partido (SELECT ... FOR UPDATE),
-- así dos personas no pueden tomar el último lugar a la vez.

create type public.match_status as enum ('open', 'full', 'closed', 'cancelled', 'finished');
create type public.acceptance_mode as enum ('auto', 'approval');
create type public.participant_status as enum ('pending', 'confirmed', 'rejected', 'cancelled');

comment on type public.match_status is
  'open: busca jugadores · full: cupos completos · closed: el organizador cerró la inscripción · cancelled · finished: ya se jugó';

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  sport_id uuid not null references public.sports (id),
  city_id uuid not null references public.cities (id),
  starts_at timestamptz not null,
  venue_name text not null check (char_length(venue_name) between 2 and 80),
  venue_address text not null check (char_length(venue_address) between 2 and 120),
  -- Total de jugadores del partido, organizador incluido.
  total_players smallint not null check (total_players between 2 and 30),
  -- Lugares que se buscan al publicar ("faltan").
  spots_needed smallint not null check (spots_needed >= 1),
  -- Lugares que siguen libres. Lo mantiene la base: spots_needed - confirmados.
  spots_left smallint not null default 0,
  level_min smallint,
  level_max smallint,
  age_min smallint check (age_min between 18 and 99),
  age_max smallint check (age_max between 18 and 99),
  price_per_person numeric(12, 2) not null default 0 check (price_per_person >= 0),
  description text check (char_length(description) <= 500),
  acceptance_mode public.acceptance_mode not null default 'auto',
  status public.match_status not null default 'open',
  -- Fase 2: partido creado desde una reserva de turno.
  booking_id uuid references public.bookings (id) on delete set null,
  -- Previsto para "destacar partido" (monetización, sin implementar).
  featured_until timestamptz,
  filled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (spots_needed < total_players),
  check (spots_left between 0 and spots_needed),
  check (level_min is null or level_max is null or level_min <= level_max),
  check (age_min is null or age_max is null or age_min <= age_max),
  foreign key (sport_id, level_min) references public.sport_levels (sport_id, rank),
  foreign key (sport_id, level_max) references public.sport_levels (sport_id, rank)
);

create index matches_open_idx on public.matches (city_id, starts_at) where status = 'open';
create index matches_organizer_idx on public.matches (organizer_id, starts_at);
create index matches_finish_idx on public.matches (starts_at) where status in ('open', 'full', 'closed');

create table public.match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status public.participant_status not null,
  -- Se anotó fuera del rango de nivel buscado (por eso necesitó aprobación).
  out_of_level boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, profile_id)
);

create index match_participants_profile_idx on public.match_participants (profile_id);

create trigger match_participants_updated_at before update on public.match_participants
  for each row execute function public.set_updated_at();

-- Helpers de acceso (security definer para no recursar en RLS) -------------

create function public.is_match_organizer(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.matches where id = p_match_id and organizer_id = (select auth.uid())
  );
$$;

create function public.is_match_participant(p_match_id uuid, p_confirmed_only boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.match_participants
    where match_id = p_match_id
      and profile_id = (select auth.uid())
      and (case when p_confirmed_only then status = 'confirmed' else status <> 'rejected' end)
  );
$$;

create function public.can_view_match(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match_id
      and (
        m.status in ('open', 'full', 'closed')
        or m.organizer_id = (select auth.uid())
        or public.is_match_participant(m.id)
        or public.is_platform_admin()
      )
  );
$$;

create function public.profile_is_complete(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profile_private
    where profile_id = p_profile_id and birth_date is not null and whatsapp is not null
  );
$$;

-- Triggers de partidos -------------------------------------------------------

create function public.matches_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Un usuario solo puede publicar a su nombre.
  if (select auth.uid()) is not null then
    new.organizer_id := (select auth.uid());
  end if;

  if not public.profile_is_complete(new.organizer_id) then
    raise exception 'Completá tu perfil (fecha de nacimiento y WhatsApp) antes de publicar.'
      using errcode = 'P0001';
  end if;
  if new.starts_at <= now() then
    raise exception 'La fecha del partido tiene que ser a futuro.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.sports where id = new.sport_id and active) then
    raise exception 'Ese deporte no está disponible.' using errcode = 'P0001';
  end if;

  new.spots_left := new.spots_needed;
  new.status := 'open';
  new.filled_at := null;
  new.cancelled_at := null;
  return new;
end;
$$;

create trigger matches_before_insert before insert on public.matches
  for each row execute function public.matches_before_insert();

create function public.matches_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_confirmed integer;
begin
  -- Edición directa del organizador (las RPC corren como owner, no como authenticated).
  if current_user = 'authenticated' then
    if old.status in ('cancelled', 'finished') then
      raise exception 'Este partido ya no se puede editar.' using errcode = 'P0001';
    end if;
    if new.starts_at is distinct from old.starts_at and new.starts_at <= now() then
      raise exception 'La fecha del partido tiene que ser a futuro.' using errcode = 'P0001';
    end if;
    select count(*) into v_confirmed
    from public.match_participants
    where match_id = new.id and status = 'confirmed';
    if new.spots_needed < v_confirmed then
      raise exception 'Ya hay % confirmados: no podés buscar menos lugares que eso.', v_confirmed
        using errcode = 'P0001';
    end if;
    new.spots_left := new.spots_needed - v_confirmed;
  end if;

  if new.status in ('open', 'full') then
    new.status := case when new.spots_left = 0 then 'full' else 'open' end::public.match_status;
  end if;
  if new.status = 'full' and new.filled_at is null then
    new.filled_at := now();
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    new.cancelled_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger matches_before_update before update on public.matches
  for each row execute function public.matches_before_update();

create function public.matches_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_event('match_created', new.organizer_id, new.id, jsonb_build_object(
      'sport_id', new.sport_id,
      'city_id', new.city_id,
      'spots_needed', new.spots_needed,
      'acceptance_mode', new.acceptance_mode,
      'has_level_range', new.level_min is not null or new.level_max is not null,
      'has_age_range', new.age_min is not null or new.age_max is not null,
      'hours_in_advance', round(extract(epoch from new.starts_at - now()) / 3600)
    ));
  elsif new.status is distinct from old.status then
    perform public.log_event('match_status_changed', (select auth.uid()), new.id,
      jsonb_build_object('from', old.status, 'to', new.status));
    if new.status = 'full' and old.filled_at is null then
      perform public.log_event('match_filled', new.organizer_id, new.id, jsonb_build_object(
        'seconds_to_fill', round(extract(epoch from new.filled_at - new.created_at)),
        'spots_needed', new.spots_needed
      ));
    end if;
  end if;
  return null;
end;
$$;

create trigger matches_after_change after insert or update on public.matches
  for each row execute function public.matches_after_change();

-- Recalcula cupos cuando cambian las inscripciones.
create function public.refresh_match_spots(p_match_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.matches m
  set spots_left = m.spots_needed - (
    select count(*) from public.match_participants
    where match_id = m.id and status = 'confirmed'
  )
  where m.id = p_match_id;
$$;

create function public.match_participants_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_match_spots(old.match_id);
    return null;
  end if;

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    perform public.refresh_match_spots(new.match_id);
    perform public.log_event('participant_' || new.status::text, new.profile_id, new.match_id,
      jsonb_build_object(
        'actor', (select auth.uid()),
        'from', case when tg_op = 'UPDATE' then old.status end,
        'out_of_level', new.out_of_level
      ));
  end if;
  return null;
end;
$$;

create trigger match_participants_after_change after insert or update or delete on public.match_participants
  for each row execute function public.match_participants_after_change();

revoke execute on function public.refresh_match_spots(uuid) from public, anon, authenticated;

-- RPC: inscripción -------------------------------------------------------------

create function public.join_match(p_match_id uuid)
returns public.participant_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_match public.matches;
  v_birth date;
  v_whatsapp text;
  v_age integer;
  v_rank smallint;
  v_out_of_level boolean;
  v_status public.participant_status;
  v_existing public.match_participants;
begin
  if v_uid is null then
    raise exception 'Necesitás iniciar sesión.' using errcode = '28000';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'No encontramos ese partido.' using errcode = 'P0002';
  end if;
  if v_match.organizer_id = v_uid then
    raise exception 'Sos el organizador de este partido.' using errcode = 'P0001';
  end if;

  select * into v_existing from public.match_participants
  where match_id = p_match_id and profile_id = v_uid;
  if found and v_existing.status in ('pending', 'confirmed') then
    return v_existing.status;
  end if;
  if found and v_existing.status = 'rejected' then
    raise exception 'El organizador no aceptó tu lugar en este partido.' using errcode = 'P0001';
  end if;

  if v_match.status <> 'open' or v_match.starts_at <= now() then
    raise exception 'Este partido ya no recibe jugadores.' using errcode = 'P0001';
  end if;

  select birth_date, whatsapp into v_birth, v_whatsapp
  from public.profile_private where profile_id = v_uid;
  if v_birth is null or v_whatsapp is null then
    raise exception 'Completá tu perfil (fecha de nacimiento y WhatsApp) para anotarte.'
      using errcode = 'P0001';
  end if;

  v_age := public.age_years(v_birth);
  if (v_match.age_min is not null and v_age < v_match.age_min)
     or (v_match.age_max is not null and v_age > v_match.age_max) then
    raise exception 'Este partido busca jugadores de % a % años.',
      coalesce(v_match.age_min, 18), coalesce(v_match.age_max::text, 'más')
      using errcode = 'P0001';
  end if;

  select level_rank into v_rank from public.player_sports
  where profile_id = v_uid and sport_id = v_match.sport_id;

  v_out_of_level := (v_match.level_min is not null or v_match.level_max is not null)
    and (
      v_rank is null
      or (v_match.level_min is not null and v_rank < v_match.level_min)
      or (v_match.level_max is not null and v_rank > v_match.level_max)
    );

  v_status := case
    when v_match.acceptance_mode = 'approval' or v_out_of_level then 'pending'
    else 'confirmed'
  end;

  if v_existing.id is not null then
    update public.match_participants
    set status = v_status,
        out_of_level = v_out_of_level,
        confirmed_at = case when v_status = 'confirmed' then now() end
    where id = v_existing.id;
  else
    insert into public.match_participants (match_id, profile_id, status, out_of_level, confirmed_at)
    values (p_match_id, v_uid, v_status, v_out_of_level,
      case when v_status = 'confirmed' then now() end);
  end if;

  return v_status;
end;
$$;

create function public.leave_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_match public.matches;
begin
  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'No encontramos ese partido.' using errcode = 'P0002';
  end if;
  if v_match.starts_at <= now() then
    raise exception 'El partido ya empezó.' using errcode = 'P0001';
  end if;

  update public.match_participants
  set status = 'cancelled', confirmed_at = null
  where match_id = p_match_id and profile_id = v_uid and status in ('pending', 'confirmed');

  if not found then
    raise exception 'No estás anotado en este partido.' using errcode = 'P0001';
  end if;
end;
$$;

-- RPC: gestión del organizador ------------------------------------------------

-- Bloquea el partido de una inscripción y verifica que quien llama lo organiza.
create function public.lock_participant_for_organizer(p_participant_id uuid)
returns public.match_participants
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.match_participants;
  v_match public.matches;
begin
  select * into v_participant from public.match_participants where id = p_participant_id;
  if not found then
    raise exception 'No encontramos esa inscripción.' using errcode = 'P0002';
  end if;

  select * into v_match from public.matches where id = v_participant.match_id for update;
  if v_match.organizer_id is distinct from (select auth.uid()) then
    raise exception 'Solo el organizador puede gestionar este partido.' using errcode = '42501';
  end if;
  if v_match.status in ('cancelled', 'finished') or v_match.starts_at <= now() then
    raise exception 'Este partido ya no se puede gestionar.' using errcode = 'P0001';
  end if;

  -- Releer con el partido bloqueado.
  select * into v_participant from public.match_participants where id = p_participant_id;
  return v_participant;
end;
$$;

revoke execute on function public.lock_participant_for_organizer(uuid) from public, anon, authenticated;

create function public.respond_to_request(p_participant_id uuid, p_accept boolean)
returns public.participant_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.match_participants;
  v_spots_left smallint;
begin
  v_participant := public.lock_participant_for_organizer(p_participant_id);

  if v_participant.status <> 'pending' then
    raise exception 'Esta solicitud ya fue respondida.' using errcode = 'P0001';
  end if;

  if p_accept then
    select spots_left into v_spots_left from public.matches where id = v_participant.match_id;
    if v_spots_left <= 0 then
      raise exception 'Ya no quedan lugares libres en este partido.' using errcode = 'P0001';
    end if;
    update public.match_participants
    set status = 'confirmed', confirmed_at = now()
    where id = p_participant_id;
    return 'confirmed';
  end if;

  update public.match_participants set status = 'rejected' where id = p_participant_id;
  return 'rejected';
end;
$$;

create function public.remove_participant(p_participant_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.match_participants;
begin
  v_participant := public.lock_participant_for_organizer(p_participant_id);

  if v_participant.status not in ('pending', 'confirmed') then
    raise exception 'Ese jugador ya no está anotado.' using errcode = 'P0001';
  end if;

  update public.match_participants
  set status = 'rejected', confirmed_at = null
  where id = p_participant_id;
end;
$$;

-- Cerrar inscripción, reabrirla o cancelar el partido.
create function public.set_match_status(p_match_id uuid, p_status public.match_status)
returns public.match_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
begin
  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'No encontramos ese partido.' using errcode = 'P0002';
  end if;
  if v_match.organizer_id is distinct from (select auth.uid()) then
    raise exception 'Solo el organizador puede gestionar este partido.' using errcode = '42501';
  end if;
  if v_match.status in ('cancelled', 'finished') then
    raise exception 'Este partido ya no se puede modificar.' using errcode = 'P0001';
  end if;
  if v_match.starts_at <= now() and p_status <> 'cancelled' then
    raise exception 'El partido ya empezó.' using errcode = 'P0001';
  end if;
  if p_status not in ('open', 'closed', 'cancelled') then
    raise exception 'Estado no permitido.' using errcode = '22023';
  end if;

  -- 'open' reabre la inscripción: el trigger decide si queda abierto o completo.
  update public.matches set status = p_status where id = p_match_id
  returning status into v_match.status;
  return v_match.status;
end;
$$;

-- Lecturas -----------------------------------------------------------------

-- Anotados de un partido con edad y nivel. Los confirmados los ve cualquiera que
-- pueda ver el partido; las solicitudes pendientes, solo el organizador.
create function public.get_match_participants(p_match_id uuid)
returns table (
  participant_id uuid,
  profile_id uuid,
  full_name text,
  avatar_url text,
  age integer,
  level_rank smallint,
  level_name text,
  status public.participant_status,
  out_of_level boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    mp.id,
    p.id,
    p.full_name,
    p.avatar_url,
    public.age_years(pp.birth_date),
    ps.level_rank,
    sl.name,
    mp.status,
    mp.out_of_level,
    mp.created_at
  from public.match_participants mp
  join public.matches m on m.id = mp.match_id
  join public.profiles p on p.id = mp.profile_id
  left join public.profile_private pp on pp.profile_id = mp.profile_id
  left join public.player_sports ps on ps.profile_id = mp.profile_id and ps.sport_id = m.sport_id
  left join public.sport_levels sl on sl.sport_id = ps.sport_id and sl.rank = ps.level_rank
  where mp.match_id = p_match_id
    and public.can_view_match(p_match_id)
    and (
      mp.status = 'confirmed'
      or (mp.status = 'pending' and m.organizer_id = (select auth.uid()))
      or mp.profile_id = (select auth.uid())
    )
  order by (mp.status = 'confirmed') desc, mp.created_at;
$$;

-- WhatsApp compartido solo cuando hay confirmación:
-- el organizador ve a sus confirmados y cada confirmado ve al organizador.
create function public.get_match_contacts(p_match_id uuid)
returns table (profile_id uuid, full_name text, whatsapp text, is_organizer boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, pp.whatsapp, false
  from public.matches m
  join public.match_participants mp on mp.match_id = m.id and mp.status = 'confirmed'
  join public.profiles p on p.id = mp.profile_id
  join public.profile_private pp on pp.profile_id = p.id
  where m.id = p_match_id and m.organizer_id = (select auth.uid())
  union all
  select p.id, p.full_name, pp.whatsapp, true
  from public.matches m
  join public.profiles p on p.id = m.organizer_id
  join public.profile_private pp on pp.profile_id = p.id
  where m.id = p_match_id and public.is_match_participant(m.id, true);
$$;

-- Búsqueda de partidos abiertos con filtros. Corre con los permisos de quien
-- llama (security invoker), así que respeta RLS.
create function public.search_matches(
  p_city_id uuid default null,
  p_sport_ids uuid[] default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_level_min smallint default null,
  p_level_max smallint default null,
  p_age_min smallint default null,
  p_age_max smallint default null,
  p_for_me boolean default false,
  p_limit integer default 50,
  p_offset integer default 0
)
returns setof public.matches
language sql
stable
set search_path = ''
as $$
  with me as (
    select public.age_years(birth_date) as age
    from public.profile_private
    where profile_id = (select auth.uid())
  )
  select m.*
  from public.matches m
  where m.status = 'open'
    and m.starts_at > now()
    and (p_city_id is null or m.city_id = p_city_id)
    and (p_sport_ids is null or cardinality(p_sport_ids) = 0 or m.sport_id = any (p_sport_ids))
    and (p_from is null or m.starts_at >= p_from)
    and (p_to is null or m.starts_at < p_to)
    -- Rango de nivel del partido que se superpone con el filtro.
    and (p_level_min is null or m.level_max is null or m.level_max >= p_level_min)
    and (p_level_max is null or m.level_min is null or m.level_min <= p_level_max)
    -- Rango de edad del partido que se superpone con el filtro.
    and (p_age_min is null or m.age_max is null or m.age_max >= p_age_min)
    and (p_age_max is null or m.age_min is null or m.age_min <= p_age_max)
    and (
      not p_for_me
      or (
        exists (
          select 1 from public.player_sports ps
          where ps.profile_id = (select auth.uid())
            and ps.sport_id = m.sport_id
            and (m.level_min is null or ps.level_rank >= m.level_min)
            and (m.level_max is null or ps.level_rank <= m.level_max)
        )
        and (m.age_min is null or (select age from me) >= m.age_min)
        and (m.age_max is null or (select age from me) <= m.age_max)
      )
    )
  -- Los destacados (monetización futura) van primero mientras estén vigentes.
  order by (m.featured_until is not null and m.featured_until > now()) desc, m.starts_at
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- Archivado automático ------------------------------------------------------

create function public.finish_past_matches()
returns integer
language sql
security definer
set search_path = ''
as $$
  with done as (
    update public.matches
    set status = 'finished'
    where status in ('open', 'full', 'closed')
      and starts_at < now() - interval '2 hours'
    returning 1
  )
  select count(*)::integer from done;
$$;

revoke execute on function public.finish_past_matches() from public, anon, authenticated;

-- RLS -----------------------------------------------------------------------

alter table public.matches enable row level security;
alter table public.match_participants enable row level security;

create policy "partidos: visibles" on public.matches
  for select to authenticated
  using (
    status in ('open', 'full', 'closed')
    or organizer_id = (select auth.uid())
    or public.is_match_participant(id)
    or public.is_platform_admin()
  );
create policy "partidos: publicar a nombre propio" on public.matches
  for insert to authenticated
  with check (organizer_id = (select auth.uid()));
create policy "partidos: edita el organizador" on public.matches
  for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));

create policy "inscripciones: visibles" on public.match_participants
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or public.is_match_organizer(match_id)
    or (status = 'confirmed' and public.can_view_match(match_id))
  );

-- Privilegios por columna: estado, cupos y destacados solo los toca la base.
revoke all on public.matches, public.match_participants from anon;
revoke insert, update, delete on public.matches, public.match_participants from authenticated;
grant insert (
  sport_id, city_id, starts_at, venue_name, venue_address, total_players, spots_needed,
  level_min, level_max, age_min, age_max, price_per_person, description, acceptance_mode
) on public.matches to authenticated;
grant update (
  city_id, starts_at, venue_name, venue_address, total_players, spots_needed,
  level_min, level_max, age_min, age_max, price_per_person, description, acceptance_mode
) on public.matches to authenticated;

revoke execute on function
  public.join_match(uuid),
  public.leave_match(uuid),
  public.respond_to_request(uuid, boolean),
  public.remove_participant(uuid),
  public.set_match_status(uuid, public.match_status),
  public.get_match_participants(uuid),
  public.get_match_contacts(uuid),
  public.search_matches(uuid, uuid[], timestamptz, timestamptz, smallint, smallint, smallint, smallint, boolean, integer, integer)
from public, anon;

grant execute on function
  public.join_match(uuid),
  public.leave_match(uuid),
  public.respond_to_request(uuid, boolean),
  public.remove_participant(uuid),
  public.set_match_status(uuid, public.match_status),
  public.get_match_participants(uuid),
  public.get_match_contacts(uuid),
  public.search_matches(uuid, uuid[], timestamptz, timestamptz, smallint, smallint, smallint, smallint, boolean, integer, integer)
to authenticated;
