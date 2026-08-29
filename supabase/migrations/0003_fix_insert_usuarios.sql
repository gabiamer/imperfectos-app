-- Fix: faltaba la política de INSERT en la tabla usuarios. Con RLS activado,
-- Postgres niega por defecto cualquier operación sin una política explícita
-- que la permita — esto bloqueaba a todo usuario recién registrado en
-- Supabase Auth de crear su fila correspondiente en public.usuarios.

create policy "usuarios_insert_propio" on usuarios
  for insert with check (auth.uid() = auth_id);
