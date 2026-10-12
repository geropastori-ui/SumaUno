-- Tests de reglas de negocio y seguridad. Correr con: npx supabase test db
-- Usan los usuarios del seed (supabase/seed.sql).
begin;
create extension if not exists pgtap with schema extensions;

select plan(36);

-- Helpers: actuar como un usuario autenticado o como anónimo.
create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$$;

-- Usuarios del seed
-- 1 Lucía (fútbol intermedio, 32 años)   2 Martín (organizador, fútbol avanzado)
-- 3 Sofía (sin fútbol, 25 años)           4 Diego (41 años)
-- 5 Julián (fútbol principiante, 29)      6 Camila (sin fútbol, 34)

grant execute on function pg_temp.login(uuid) to authenticated;

-- Partido de prueba: fútbol, faltan 2, intermedio a avanzado, 25 a 40 años, automático.
set local role authenticated;
select pg_temp.login('00000000-0000-4000-8000-000000000002');

insert into public.matches (sport_id, city_id, starts_at, venue_name, venue_address,
  total_players, spots_needed, level_min, level_max, age_min, age_max)
select s.id, c.id, now() + interval '2 days', 'Cancha Test', 'Calle Falsa 123', 10, 2, 2, 3, 25, 40
from public.sports s, public.cities c where s.slug = 'futbol-5' and c.slug = 'santa-fe';

select throws_ok(
  $$insert into public.matches (organizer_id, sport_id, city_id, starts_at, venue_name, venue_address,
      total_players, spots_needed)
    select '00000000-0000-4000-8000-000000000001', s.id, c.id, now() + interval '1 day', 'Otro', 'Otra', 4, 1
    from public.sports s, public.cities c where s.slug = 'padel' and c.slug = 'santa-fe'$$,
  '42501', null,
  'No se puede publicar a nombre de otro'
);

create temporary table t_match on commit drop as
  select id from public.matches where venue_name = 'Cancha Test';
grant select on t_match to authenticated;

select is(
  (select organizer_id from public.matches where id = (select id from t_match)),
  '00000000-0000-4000-8000-000000000002'::uuid,
  'El organizador es siempre quien publica'
);
select is((select spots_left from public.matches where id = (select id from t_match)), 2::smallint,
  'Arranca con todos los lugares libres');

-- Edad fuera de rango
select pg_temp.login('00000000-0000-4000-8000-000000000004');
select throws_like(
  format('select public.join_match(%L)', (select id from t_match)),
  '%de 25 a 40 años%',
  'Fuera del rango de edad no puede anotarse'
);

-- Nivel dentro del rango + modo automático: confirmado
select pg_temp.login('00000000-0000-4000-8000-000000000001');
select is(public.join_match((select id from t_match)), 'confirmed'::public.participant_status,
  'En rango y modo automático: queda confirmado');
select is(public.join_match((select id from t_match)), 'confirmed'::public.participant_status,
  'Anotarse dos veces es idempotente');
select is((select spots_left from public.matches where id = (select id from t_match)), 1::smallint,
  'Un confirmado descuenta un lugar');

-- Fuera de nivel en modo automático: pasa por aprobación
select pg_temp.login('00000000-0000-4000-8000-000000000005');
select is(public.join_match((select id from t_match)), 'pending'::public.participant_status,
  'Fuera de nivel queda pendiente aunque el partido sea automático');

-- Sin nivel cargado para ese deporte: también pendiente
select pg_temp.login('00000000-0000-4000-8000-000000000003');
select is(public.join_match((select id from t_match)), 'pending'::public.participant_status,
  'Sin nivel en el deporte queda pendiente');

-- Un no organizador no puede aprobar (el id se busca como admin: por RLS, Sofía ni lo ve)
reset role;
create temporary table t_julian on commit drop as
  select id from public.match_participants
  where profile_id = '00000000-0000-4000-8000-000000000005' and match_id = (select id from t_match);
grant select on t_julian to authenticated;
set local role authenticated;
select throws_ok(
  format('select public.respond_to_request(%L, true)', (select id from t_julian)),
  '42501', null,
  'Solo el organizador aprueba solicitudes'
);

-- Un pendiente no ve las otras solicitudes pendientes
select is(
  (select count(*)::int from public.get_match_participants((select id from t_match)) where status = 'pending'),
  1,
  'Un jugador pendiente solo ve su propia solicitud pendiente'
);

-- El organizador aprueba a Julián: se completa
select pg_temp.login('00000000-0000-4000-8000-000000000002');
select is(
  (select count(*)::int from public.get_match_participants((select id from t_match)) where status = 'pending'),
  2,
  'El organizador ve todas las solicitudes pendientes'
);
select is(
  public.respond_to_request(
    (select id from public.match_participants where profile_id = '00000000-0000-4000-8000-000000000005'
       and match_id = (select id from t_match)), true),
  'confirmed'::public.participant_status,
  'El organizador aprueba una solicitud'
);
select is((select status from public.matches where id = (select id from t_match)), 'full'::public.match_status,
  'Sin lugares libres el partido pasa a completo');
select isnt((select filled_at from public.matches where id = (select id from t_match)), null,
  'Se registra cuándo se completó');

select throws_like(
  format('select public.respond_to_request(%L, true)',
    (select id from public.match_participants where profile_id = '00000000-0000-4000-8000-000000000003'
       and match_id = (select id from t_match))),
  '%no quedan lugares%',
  'No se puede aprobar si no hay lugar'
);

-- Partido completo: no recibe más jugadores
select pg_temp.login('00000000-0000-4000-8000-000000000006');
select throws_like(
  format('select public.join_match(%L)', (select id from t_match)),
  '%ya no recibe jugadores%',
  'Un partido completo no acepta inscripciones'
);
select is((select count(*)::int from public.search_matches() where id = (select id from t_match)), 0,
  'Un partido completo no aparece en la búsqueda de abiertos');

-- Contactos de WhatsApp
select is((select count(*)::int from public.get_match_contacts((select id from t_match))), 0,
  'Alguien ajeno al partido no ve ningún WhatsApp');

select pg_temp.login('00000000-0000-4000-8000-000000000003');
select is((select count(*)::int from public.get_match_contacts((select id from t_match))), 0,
  'Un pendiente no ve WhatsApp');

select pg_temp.login('00000000-0000-4000-8000-000000000005');
select is(
  (select whatsapp from public.get_match_contacts((select id from t_match)) where is_organizer),
  '5493420000002',
  'Un confirmado ve el WhatsApp del organizador'
);
select is((select count(*)::int from public.profile_private), 1,
  'Cada uno solo lee sus propios datos privados');

select pg_temp.login('00000000-0000-4000-8000-000000000002');
select is((select count(*)::int from public.get_match_contacts((select id from t_match))), 2,
  'El organizador ve el WhatsApp de sus confirmados');

-- Alguien se baja: el partido vuelve a abrirse
select pg_temp.login('00000000-0000-4000-8000-000000000001');
select lives_ok(format('select public.leave_match(%L)', (select id from t_match)), 'Un jugador cancela su lugar');
select is((select status from public.matches where id = (select id from t_match)), 'open'::public.match_status,
  'Si alguien se baja, el partido vuelve a abrirse');

-- Privilegios por columna
select throws_ok(
  $$update public.profiles set role = 'platform_admin' where id = '00000000-0000-4000-8000-000000000001'$$,
  '42501', null,
  'Un usuario no puede cambiarse el rol'
);
select throws_ok(
  format($$update public.matches set status = 'finished' where id = %L$$, (select id from t_match)),
  '42501', null,
  'Nadie cambia el estado de un partido por fuera de las funciones'
);

-- Un no organizador no edita el partido (RLS: no afecta filas)
update public.matches set venue_name = 'Hackeado' where id = (select id from t_match);
select is((select venue_name from public.matches where id = (select id from t_match)), 'Cancha Test',
  'Solo el organizador edita su partido');

-- El organizador edita los lugares buscados
select pg_temp.login('00000000-0000-4000-8000-000000000002');
update public.matches set spots_needed = 1 where id = (select id from t_match);
select is((select status from public.matches where id = (select id from t_match)), 'full'::public.match_status,
  'Bajar los lugares buscados recalcula cupos y estado');

-- Cerrar, reabrir y cancelar
select is(public.set_match_status((select id from t_match), 'closed'), 'closed'::public.match_status,
  'El organizador cierra la inscripción');
select is(public.set_match_status((select id from t_match), 'open'), 'full'::public.match_status,
  'Al reabrir, el estado se recalcula según los cupos');
select is(public.set_match_status((select id from t_match), 'cancelled'), 'cancelled'::public.match_status,
  'El organizador cancela el partido');

select pg_temp.login('00000000-0000-4000-8000-000000000006');
select is((select count(*)::int from public.matches where id = (select id from t_match)), 0,
  'Un partido cancelado no lo ve alguien ajeno');

-- Eventos
select throws_ok($$select public.track_event('drop_tables')$$, '22023', null,
  'El cliente solo registra eventos permitidos');

reset role;
select ok(
  (select count(*) from public.events where match_id = (select id from t_match) and name = 'match_filled') = 1,
  'Se registra el evento de partido completo'
);

-- Registro de menores
select throws_like(
  $$insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
            'menor@test.com', jsonb_build_object('birth_date', (current_date - interval '17 years')::date::text))$$,
  '%mayores de 18%',
  'No se puede registrar un menor de 18'
);

select * from finish();
rollback;
