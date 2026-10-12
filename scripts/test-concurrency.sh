#!/usr/bin/env bash
# Verifica que dos jugadores no puedan tomar el último lugar a la vez.
# Requiere Supabase local levantado con el seed (npm run db:reset).
set -euo pipefail

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
MATCH_ID="20000000-0000-4000-8000-0000000000cc"

psql "$DB_URL" -q -v ON_ERROR_STOP=1 <<SQL
delete from public.matches where id = '$MATCH_ID';
insert into public.matches (id, organizer_id, sport_id, city_id, starts_at, venue_name, venue_address, total_players, spots_needed)
select '$MATCH_ID', '00000000-0000-4000-8000-000000000002', s.id, c.id, now() + interval '1 day', 'Test concurrencia', 'Calle 1', 4, 1
from public.sports s, public.cities c where s.slug = 'futbol-5' and c.slug = 'santa-fe';
SQL

join_as() {
  psql "$DB_URL" -q -t -A 2>&1 <<SQL || true
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"$1","role":"authenticated"}', true);
select 'resultado: ' || public.join_match('$MATCH_ID');
select pg_sleep(1);
commit;
SQL
}

join_as 00000000-0000-4000-8000-000000000001 > /tmp/sumauno-race-a.log &
join_as 00000000-0000-4000-8000-000000000004 > /tmp/sumauno-race-b.log &
wait

echo "Jugador A: $(grep -h -o 'resultado: .*\|ERROR: .*' /tmp/sumauno-race-a.log | head -1)"
echo "Jugador B: $(grep -h -o 'resultado: .*\|ERROR: .*' /tmp/sumauno-race-b.log | head -1)"

CONFIRMED=$(psql "$DB_URL" -t -A -c "select count(*) from public.match_participants where match_id = '$MATCH_ID' and status = 'confirmed'")
STATE=$(psql "$DB_URL" -t -A -c "select status || ' / libres: ' || spots_left from public.matches where id = '$MATCH_ID'")
psql "$DB_URL" -q -c "delete from public.matches where id = '$MATCH_ID'"

echo "Confirmados: $CONFIRMED · Partido: $STATE"
if [ "$CONFIRMED" = "1" ]; then
  echo "OK: solo uno se quedó con el último lugar."
else
  echo "FALLA: hubo $CONFIRMED confirmados para 1 lugar." >&2
  exit 1
fi
