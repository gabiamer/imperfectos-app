-- Corrige los hallazgos del code review de Qodo sobre la rama feature/auth-telefono:
--   #1 y #2: registro bloqueado por RLS / cuentas huérfanas en auth.users
--   #4: un usuario podía cambiar su propio rol a 'admin' vía UPDATE
--   #5 (parte de base de datos): un comprador podía insertar publicaciones

-- 1. Creación atómica del perfil vía trigger -------------------------------
-- En vez de que el navegador inserte en `usuarios` (lo que requería una
-- política de INSERT y dejaba una ventana donde el insert podía fallar y
-- dejar el usuario de auth.users huérfano), la fila se crea automáticamente
-- en la misma transacción que crea el usuario de Auth. SECURITY DEFINER hace
-- que la función corra con privilegios elevados, sin depender del RLS del
-- cliente que llama.

create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (auth_id, nombre, telefono, rol, zona)
  values (
    new.id,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'telefono',
    coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'comprador'),
    new.raw_user_meta_data->>'zona'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();

-- Ya no necesitamos que el cliente (anon/authenticated) pueda insertar
-- directo en usuarios — el trigger de arriba es el único camino ahora.
drop policy if exists "usuarios_insert_propio" on usuarios;

-- 2. Inmutabilidad del rol (evita self-promotion a admin) -------------------
-- La política usuarios_update_propio (migración 0001) permite a cada quien
-- actualizar su propia fila, pero sin restringir columnas — eso incluía
-- `rol`, así que cualquier usuario podía llamar a supabase.from('usuarios')
-- .update({ rol: 'admin' }) directo desde la consola del navegador y
-- convertirse en admin. Este trigger revierte silenciosamente cualquier
-- cambio de rol que no venga de un admin existente.

create or replace function public.prevenir_auto_promocion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol then
    if not exists (
      select 1 from usuarios where auth_id = auth.uid() and rol = 'admin'
    ) then
      new.rol := old.rol;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists before_usuarios_update_bloquear_rol on usuarios;
create trigger before_usuarios_update_bloquear_rol
  before update on usuarios
  for each row execute function public.prevenir_auto_promocion();

-- 3. Solo vendedores pueden crear publicaciones (defensa en profundidad) ---
-- El frontend va a ocultar/bloquear la ruta /publicar para compradores,
-- pero eso no protege contra alguien llamando a la API directo. Reforzamos
-- también a nivel de base de datos.

drop policy if exists "publicaciones_insert_propio" on publicaciones;
create policy "publicaciones_insert_propio" on publicaciones
  for insert with check (
    vendedor_id in (
      select id from usuarios where auth_id = auth.uid() and rol = 'vendedor'
    )
  );
