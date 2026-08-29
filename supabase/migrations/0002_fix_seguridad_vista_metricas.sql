-- Corrige el aviso de seguridad "security_definer_view" (0010) sobre la vista
-- metricas_impacto: por defecto, una vista en Postgres corre con los permisos
-- de quien la creó (bypass de RLS). La recreamos con security_invoker=on para
-- que respete el RLS de las tablas que consulta.
--
-- Como la vista necesita agregar datos de TODA la plataforma para el panel de
-- admin, agregamos políticas explícitas de "el admin ve todo" en las tablas
-- que la vista consulta. Sin esto, un admin autenticado vería la vista vacía
-- o incompleta al quedar filtrada por las políticas normales (solo activas /
-- solo lo propio).

-- 1. Políticas de admin en publicaciones y contactos_interes ----------------

create policy "publicaciones_admin_ve_todo" on publicaciones
  for select using (
    exists (select 1 from usuarios where auth_id = auth.uid() and rol = 'admin')
  );

create policy "contactos_admin_ve_todo" on contactos_interes
  for select using (
    exists (select 1 from usuarios where auth_id = auth.uid() and rol = 'admin')
  );

-- tarifas_publicacion ya tenía esta lógica dentro de "tarifas_select_relacionado"
-- en la migración 0001, no hace falta agregar nada ahí.

-- 2. Recrear la vista con security_invoker=on --------------------------------

drop view if exists metricas_impacto;

create view metricas_impacto
with (security_invoker = on)
as
select
  count(distinct p.vendedor_id) filter (
    where p.creado_en > now() - interval '30 days'
  ) as vendedores_activos_30d,
  count(*) filter (where p.estado = 'activa') as publicaciones_activas,
  sum(p.cantidad) as kg_totales_publicados,
  sum(p.precio_total) as bs_totales_declarados,
  (select count(*) from contactos_interes) as total_contactos,
  (select coalesce(sum(monto), 0) from tarifas_publicacion where estado_pago = 'confirmado') as ingresos_confirmados
from publicaciones p;
