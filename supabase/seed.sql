-- Datos de ejemplo SOLO para desarrollo local (`npm run db:reset`).
-- No correr en producción. Todos los usuarios demo usan la contraseña: demo-sumauno
-- Los teléfonos son ficticios.

do $$
declare
  v_users jsonb := '[
    {"id":"00000000-0000-4000-8000-000000000001","email":"lucia@demo.sumauno.app","name":"Lucía Fernández","birth":"1994-03-12","wa":"5493420000001"},
    {"id":"00000000-0000-4000-8000-000000000002","email":"martin@demo.sumauno.app","name":"Martín Gómez","birth":"1989-07-30","wa":"5493420000002"},
    {"id":"00000000-0000-4000-8000-000000000003","email":"sofia@demo.sumauno.app","name":"Sofía Ibarra","birth":"2000-11-05","wa":"5493420000003"},
    {"id":"00000000-0000-4000-8000-000000000004","email":"diego@demo.sumauno.app","name":"Diego Paredes","birth":"1985-01-21","wa":"5493420000004"},
    {"id":"00000000-0000-4000-8000-000000000005","email":"juli@demo.sumauno.app","name":"Julián Ríos","birth":"1997-05-17","wa":"5493420000005"},
    {"id":"00000000-0000-4000-8000-000000000006","email":"cami@demo.sumauno.app","name":"Camila Sosa","birth":"1992-09-02","wa":"5493420000006"}
  ]';
  v_user jsonb;
begin
  for v_user in select * from jsonb_array_elements(v_users) loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      (v_user ->> 'id')::uuid, 'authenticated', 'authenticated',
      v_user ->> 'email',
      extensions.crypt('demo-sumauno', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', v_user ->> 'name', 'birth_date', v_user ->> 'birth'),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), (v_user ->> 'id')::uuid, v_user ->> 'id', 'email',
      jsonb_build_object('sub', v_user ->> 'id', 'email', v_user ->> 'email', 'email_verified', true),
      now(), now(), now()
    );

    update public.profile_private set whatsapp = v_user ->> 'wa'
    where profile_id = (v_user ->> 'id')::uuid;
    update public.profiles set city_id = (select id from public.cities where slug = 'santa-fe')
    where id = (v_user ->> 'id')::uuid;
  end loop;
end;
$$;

-- Deportes y nivel de cada jugador demo.
insert into public.player_sports (profile_id, sport_id, level_rank)
select p.profile_id::uuid, s.id, p.level_rank
from (values
  ('00000000-0000-4000-8000-000000000001', 'padel', 3),
  ('00000000-0000-4000-8000-000000000001', 'futbol-5', 2),
  ('00000000-0000-4000-8000-000000000002', 'futbol-5', 3),
  ('00000000-0000-4000-8000-000000000002', 'basquet-3x3', 2),
  ('00000000-0000-4000-8000-000000000003', 'padel', 5),
  ('00000000-0000-4000-8000-000000000004', 'futbol-5', 2),
  ('00000000-0000-4000-8000-000000000004', 'padel', 2),
  ('00000000-0000-4000-8000-000000000005', 'basquet-3x3', 3),
  ('00000000-0000-4000-8000-000000000005', 'futbol-5', 1),
  ('00000000-0000-4000-8000-000000000006', 'padel', 4)
) as p (profile_id, sport_slug, level_rank)
join public.sports s on s.slug = p.sport_slug;

-- Partidos de ejemplo, siempre a futuro respecto del momento del seed.
-- Hora local argentina: fecha de hoy + N días a las HH:MM.
create temporary table seed_matches as
select *
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000002'::uuid, 'futbol-5', 1, '21:00',
   'Complejo La Redonda', 'Av. Freyre 2150', 10, 2, 2, 3, null::int, null::int, 4500, 'Falta un arquero y uno de campo. Cancha de sintético techada.', 'auto'),
  ('10000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, 'padel', 2, '19:30',
   'Pádel Costanera', 'Av. Almirante Brown 5200', 4, 1, 3, 4, 25, 40, 6000, 'Partido de dobles, buscamos alguien de 6ta o 5ta.', 'approval'),
  ('10000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000005'::uuid, 'basquet-3x3', 1, '18:00',
   'Plaza del Soldado', 'Av. Rivadavia y Lisandro de la Torre', 6, 3, null, null, null, null, 0, 'Armamos 3x3 en la plaza, se juega a 21. Traigan agua.', 'auto'),
  ('10000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000004'::uuid, 'futbol-5', 3, '22:00',
   'Cancha El Potrero', 'Calle Salta 3400', 10, 4, 1, 2, null, 45, 4000, 'Fútbol tranqui entre amigos, nivel recreativo.', 'auto'),
  ('10000000-0000-4000-8000-000000000005'::uuid, '00000000-0000-4000-8000-000000000006'::uuid, 'padel', 4, '20:00',
   'Club Náutico Sur', 'Calle Lavalle 1200', 4, 2, 4, 6, null, null, 7500, 'Buscamos pareja para torneo amistoso, nivel 5ta para arriba.', 'approval'),
  ('10000000-0000-4000-8000-000000000006'::uuid, '00000000-0000-4000-8000-000000000002'::uuid, 'futbol-5', 5, '20:00',
   'Complejo La Redonda', 'Av. Freyre 2150', 10, 1, null, null, null, null, 4500, 'Nos falta uno para el de los martes.', 'auto')
) as t (id, organizer_id, sport_slug, days_ahead, local_time, venue_name, venue_address,
        total_players, spots_needed, level_min, level_max, age_min, age_max, price, description, mode);

insert into public.matches (
  id, organizer_id, sport_id, city_id, starts_at, venue_name, venue_address,
  total_players, spots_needed, level_min, level_max, age_min, age_max,
  price_per_person, description, acceptance_mode
)
select
  t.id, t.organizer_id, s.id, (select id from public.cities where slug = 'santa-fe'),
  ((public.today_ar() + t.days_ahead) + t.local_time::time) at time zone 'America/Argentina/Buenos_Aires',
  t.venue_name, t.venue_address, t.total_players, t.spots_needed,
  t.level_min, t.level_max, t.age_min, t.age_max, t.price, t.description, t.mode::public.acceptance_mode
from seed_matches t
join public.sports s on s.slug = t.sport_slug;

-- Algunos anotados (los triggers recalculan cupos y estado).
insert into public.match_participants (match_id, profile_id, status, confirmed_at) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'confirmed', now()),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'confirmed', now()),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000006', 'pending', null),
  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000001', 'confirmed', now());

drop table seed_matches;
