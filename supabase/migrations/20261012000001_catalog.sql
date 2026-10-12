-- Catálogo: ciudades, deportes y escalas de nivel por deporte.
-- Sumar una ciudad o un deporte es insertar filas: no requiere tocar código.

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  province text not null,
  country_code char(2) not null default 'AR',
  timezone text not null default 'America/Argentina/Buenos_Aires',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.cities is 'Ciudades donde opera la app. active=false las oculta sin borrarlas.';

create table public.sports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  -- Clave del ícono en el front (src/components/sport-icon.tsx). Si no existe, se usa uno genérico.
  icon text not null,
  typical_players smallint not null check (typical_players between 2 and 30),
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

comment on column public.sports.typical_players is 'Jugadores totales habituales de un partido (valor por defecto al publicar).';

create table public.sport_levels (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports (id) on delete cascade,
  -- Orden creciente de habilidad: sirve para comparar y filtrar por rango.
  rank smallint not null check (rank > 0),
  name text not null,
  description text not null,
  unique (sport_id, rank)
);

comment on table public.sport_levels is 'Escala de nivel/categoría propia de cada deporte. rank mayor = mejor nivel.';

alter table public.cities enable row level security;
alter table public.sports enable row level security;
alter table public.sport_levels enable row level security;

-- El catálogo es público (se usa también en el registro, antes de iniciar sesión).
create policy "catalogo: ciudades visibles" on public.cities
  for select to anon, authenticated using (true);
create policy "catalogo: deportes visibles" on public.sports
  for select to anon, authenticated using (true);
create policy "catalogo: niveles visibles" on public.sport_levels
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.cities, public.sports, public.sport_levels from anon, authenticated;

-- Datos del catálogo inicial (son parte del producto, no datos de prueba).
insert into public.cities (slug, name, province) values
  ('santa-fe', 'Santa Fe', 'Santa Fe'),
  ('santo-tome', 'Santo Tomé', 'Santa Fe'),
  ('parana', 'Paraná', 'Entre Ríos');

insert into public.sports (slug, name, icon, typical_players, sort_order) values
  ('futbol-5', 'Fútbol 5', 'futbol', 10, 1),
  ('padel', 'Pádel', 'padel', 4, 2),
  ('basquet-3x3', 'Básquet 3x3', 'basquet', 6, 3);

insert into public.sport_levels (sport_id, rank, name, description)
select s.id, l.rank, l.name, l.description
from public.sports s
join (values
  ('futbol-5', 1, 'Principiante', 'Juego de vez en cuando, lo hago para divertirme.'),
  ('futbol-5', 2, 'Intermedio', 'Juego seguido y manejo los fundamentos.'),
  ('futbol-5', 3, 'Avanzado', 'Juego seguido, en torneos o jugué en club.'),
  ('basquet-3x3', 1, 'Principiante', 'Tiro al aro de vez en cuando, sin mucha técnica.'),
  ('basquet-3x3', 2, 'Intermedio', 'Juego seguido, manejo bien la pelota y el tiro.'),
  ('basquet-3x3', 3, 'Avanzado', 'Juego en liga o jugué federado.'),
  ('padel', 1, '8va', 'Estoy empezando: aprendo los golpes básicos.'),
  ('padel', 2, '7ma', 'Sostengo pelotas largas y conozco las reglas.'),
  ('padel', 3, '6ta', 'Juego seguido, uso las paredes y la volea.'),
  ('padel', 4, '5ta', 'Buena técnica, juego torneos de categoría.'),
  ('padel', 5, '4ta', 'Muy buen nivel, gano partidos de torneo.'),
  ('padel', 6, '3ra', 'Nivel alto, competitivo en torneos fuertes.'),
  ('padel', 7, '2da', 'Nivel muy alto, cerca de lo semiprofesional.'),
  ('padel', 8, '1ra', 'Elite amateur o profesional.')
) as l (sport_slug, rank, name, description) on l.sport_slug = s.slug;
