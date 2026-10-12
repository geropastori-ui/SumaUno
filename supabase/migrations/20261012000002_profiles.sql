-- Perfiles de jugadores, datos privados y deportes que practican.

create type public.app_role as enum ('player', 'club_admin', 'platform_admin');

-- Utilidades generales ------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Fecha de hoy en Argentina (la base corre en UTC).
create function public.today_ar()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date;
$$;

create function public.age_years(p_birth_date date)
returns integer
language sql
stable
set search_path = ''
as $$
  select extract(year from age(public.today_ar(), p_birth_date))::integer;
$$;

-- Perfil público ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_url text,
  city_id uuid references public.cities (id),
  role public.app_role not null default 'player',
  -- Previsto para membresías (sin implementar en el MVP).
  membership_tier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos visibles para cualquier usuario autenticado. Lo privado vive en profile_private.';

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Datos privados: RLS filtra filas, no columnas, por eso van en otra tabla.
create table public.profile_private (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date,
  -- Solo dígitos, con código de país (ej. 5493421234567). Es el formato que usa wa.me.
  whatsapp text check (whatsapp ~ '^[0-9]{10,15}$'),
  updated_at timestamptz not null default now()
);

comment on table public.profile_private is 'Fecha de nacimiento y WhatsApp. Solo los ve el dueño; el contacto se comparte por get_match_contacts().';

create trigger profile_private_updated_at before update on public.profile_private
  for each row execute function public.set_updated_at();

create function public.check_adult()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_date is not null then
    if new.birth_date > (public.today_ar() - interval '18 years')::date then
      raise exception 'Por ahora SumáUno es solo para mayores de 18 años.'
        using errcode = 'check_violation';
    end if;
    if new.birth_date < date '1920-01-01' then
      raise exception 'Revisá tu fecha de nacimiento.' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger profile_private_check_adult before insert or update of birth_date on public.profile_private
  for each row execute function public.check_adult();

-- Deportes que practica cada jugador y su nivel ---------------------------

create table public.player_sports (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  sport_id uuid not null references public.sports (id),
  level_rank smallint not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, sport_id),
  foreign key (sport_id, level_rank) references public.sport_levels (sport_id, rank)
);

-- Alta automática del perfil al registrarse --------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_birth text := v_meta ->> 'birth_date';
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    left(trim(coalesce(v_meta ->> 'full_name', v_meta ->> 'name', '')), 80),
    coalesce(v_meta ->> 'avatar_url', v_meta ->> 'picture')
  );

  insert into public.profile_private (profile_id, birth_date)
  values (
    new.id,
    case when v_birth ~ '^\d{4}-\d{2}-\d{2}$' then v_birth::date end
  );

  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Roles ---------------------------------------------------------------------

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'platform_admin'
  );
$$;

-- Edad pública de un perfil (la fecha de nacimiento nunca sale de la base).
create function public.profile_age(p_profile_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select public.age_years(birth_date)
  from public.profile_private
  where profile_id = p_profile_id;
$$;

-- RLS -----------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.player_sports enable row level security;

create policy "perfiles: visibles para usuarios" on public.profiles
  for select to authenticated using (true);
create policy "perfiles: editar el propio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "privado: ver el propio" on public.profile_private
  for select to authenticated using (profile_id = (select auth.uid()));
create policy "privado: editar el propio" on public.profile_private
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "deportes del jugador: visibles" on public.player_sports
  for select to authenticated using (true);
create policy "deportes del jugador: alta propia" on public.player_sports
  for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "deportes del jugador: editar propios" on public.player_sports
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
create policy "deportes del jugador: borrar propios" on public.player_sports
  for delete to authenticated using (profile_id = (select auth.uid()));

-- Privilegios por columna: el usuario no puede cambiarse el rol ni la membresía.
revoke all on public.profiles, public.profile_private, public.player_sports from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, avatar_url, city_id) on public.profiles to authenticated;
revoke insert, update, delete on public.profile_private from authenticated;
grant update (birth_date, whatsapp) on public.profile_private to authenticated;
revoke update on public.player_sports from authenticated;
grant update (level_rank) on public.player_sports to authenticated;

-- Administración del catálogo por la plataforma.
create policy "catalogo: admin gestiona ciudades" on public.cities
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "catalogo: admin gestiona deportes" on public.sports
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "catalogo: admin gestiona niveles" on public.sport_levels
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());
grant insert, update, delete on public.cities, public.sports, public.sport_levels to authenticated;

-- Storage: avatares ---------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Cada usuario escribe solo dentro de la carpeta con su id: avatars/<uid>/archivo
create policy "avatares: subir el propio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatares: reemplazar el propio" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatares: borrar el propio" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
