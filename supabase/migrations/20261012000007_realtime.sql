-- Realtime: el detalle del partido se actualiza en vivo cuando alguien se anota o se baja.
-- Realtime respeta RLS, así que cada usuario solo recibe cambios de filas que puede ver.
alter publication supabase_realtime add table public.matches, public.match_participants;
