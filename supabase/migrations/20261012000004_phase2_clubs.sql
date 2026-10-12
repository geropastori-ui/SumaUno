-- FASE 2 (solo esquema y seguridad, sin pantallas): clubes, sedes, canchas,
-- turnos y reservas. Los pagos se diseñan aparte (Mercado Pago marketplace);
-- acá solo quedan las columnas para vincular una reserva con su pago.

create type public.club_member_role as enum ('owner', 'staff');
create type public.slot_status as enum ('available', 'held', 'booked', 'blocked');
create type public.booking_status as enum ('pending_payment', 'confirmed', 'cancelled', 'refunded', 'expired');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'refunded', 'cancelled');

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text,
  city_id uuid not null references public.cities (id),
  phone text,
  -- Un club se publica cuando la plataforma lo aprueba.
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.club_member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (club_id, profile_id)
);

-- Cuenta de cobro del club en el proveedor de pagos. Los tokens OAuth NO se
-- guardan acá: van cifrados del lado del servidor (Supabase Vault o similar).
create table public.club_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  provider text not null check (provider in ('mercadopago')),
  external_account_id text,
  status text not null default 'pending' check (status in ('pending', 'connected', 'revoked')),
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (club_id, provider)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  address text not null,
  city_id uuid not null references public.cities (id),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.courts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  sport_id uuid not null references public.sports (id),
  name text not null,
  surface text,
  is_indoor boolean not null default false,
  has_lighting boolean not null default true,
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.court_slots (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price numeric(12, 2) not null check (price >= 0),
  currency char(3) not null default 'ARS',
  status public.slot_status not null default 'available',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (court_id, starts_at)
);

create index court_slots_available_idx on public.court_slots (starts_at) where status = 'available';

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.court_slots (id),
  booked_by uuid not null references public.profiles (id),
  status public.booking_status not null default 'pending_payment',
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  platform_fee numeric(12, 2) not null default 0 check (platform_fee >= 0),
  currency char(3) not null default 'ARS',
  payment_provider text,
  payment_external_id text,
  payment_status public.payment_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un turno no puede tener dos reservas activas.
create unique index bookings_active_slot_idx on public.bookings (slot_id)
  where status in ('pending_payment', 'confirmed');

create trigger clubs_updated_at before update on public.clubs
  for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- Helpers de pertenencia ----------------------------------------------------

create function public.is_club_member(p_club_id uuid, p_owner_only boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club_id
      and profile_id = (select auth.uid())
      and (not p_owner_only or role = 'owner')
  );
$$;

create function public.venue_club_id(p_venue_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select club_id from public.venues where id = p_venue_id;
$$;

create function public.court_club_id(p_court_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select v.club_id from public.courts c join public.venues v on v.id = c.venue_id where c.id = p_court_id;
$$;

create function public.slot_club_id(p_slot_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select public.court_club_id(court_id) from public.court_slots where id = p_slot_id;
$$;

-- RLS: cada club ve y modifica solo lo suyo ---------------------------------

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_payment_accounts enable row level security;
alter table public.venues enable row level security;
alter table public.courts enable row level security;
alter table public.court_slots enable row level security;
alter table public.bookings enable row level security;

create policy "clubes: activos visibles" on public.clubs
  for select to authenticated
  using (active or public.is_club_member(id) or public.is_platform_admin());
create policy "clubes: alta por la plataforma" on public.clubs
  for insert to authenticated with check (public.is_platform_admin());
create policy "clubes: editar el propio" on public.clubs
  for update to authenticated
  using (public.is_club_member(id, true) or public.is_platform_admin())
  with check (public.is_club_member(id, true) or public.is_platform_admin());

create policy "miembros: ver los del propio club" on public.club_members
  for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_club_member(club_id) or public.is_platform_admin());
create policy "miembros: gestiona el dueño" on public.club_members
  for all to authenticated
  using (public.is_club_member(club_id, true) or public.is_platform_admin())
  with check (public.is_club_member(club_id, true) or public.is_platform_admin());

create policy "cuentas de cobro: ve el dueño" on public.club_payment_accounts
  for select to authenticated
  using (public.is_club_member(club_id, true) or public.is_platform_admin());

create policy "sedes: visibles" on public.venues
  for select to authenticated using (true);
create policy "sedes: gestiona el club" on public.venues
  for all to authenticated
  using (public.is_club_member(club_id) or public.is_platform_admin())
  with check (public.is_club_member(club_id) or public.is_platform_admin());

create policy "canchas: visibles" on public.courts
  for select to authenticated using (true);
create policy "canchas: gestiona el club" on public.courts
  for all to authenticated
  using (public.is_club_member(public.venue_club_id(venue_id)) or public.is_platform_admin())
  with check (public.is_club_member(public.venue_club_id(venue_id)) or public.is_platform_admin());

create policy "turnos: visibles" on public.court_slots
  for select to authenticated using (true);
create policy "turnos: gestiona el club" on public.court_slots
  for all to authenticated
  using (public.is_club_member(public.court_club_id(court_id)) or public.is_platform_admin())
  with check (public.is_club_member(public.court_club_id(court_id)) or public.is_platform_admin());

-- Las reservas se crean y actualizan desde el servidor (flujo de pago), no desde el cliente.
create policy "reservas: ve quien reservó y el club" on public.bookings
  for select to authenticated
  using (
    booked_by = (select auth.uid())
    or public.is_club_member(public.slot_club_id(slot_id))
    or public.is_platform_admin()
  );

revoke all on public.clubs, public.club_members, public.club_payment_accounts,
  public.venues, public.courts, public.court_slots, public.bookings from anon;
revoke insert, update, delete on public.club_payment_accounts, public.bookings from authenticated;
