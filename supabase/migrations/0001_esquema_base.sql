-- Esquema base del MVP — Prompt 1 (feature/esquema-db)
-- Punto de partida: revisar y ajustar en equipo antes de aplicar en Supabase.
-- Corresponde al modelo de negocio: tarifa por publicación (no comisión sobre
-- venta), 2 publicaciones gratis por vendedor por mes calendario.

create extension if not exists "pgcrypto";

-- ENUMs -----------------------------------------------------------------

create type rol_usuario as enum ('vendedor', 'comprador', 'admin');

create type categoria_producto as enum (
  'papa', 'cebolla', 'zanahoria', 'zapallo', 'manzana', 'citricos', 'otro'
);

create type estado_publicacion as enum (
  'pendiente_pago', 'activa', 'vendida', 'vencida', 'retirada'
);

create type estado_pago_tarifa as enum ('pendiente', 'confirmado');

-- Tablas ------------------------------------------------------------------

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid references auth.users (id) on delete cascade,
  nombre text not null,
  telefono text not null unique,
  rol rol_usuario not null default 'vendedor',
  zona text,
  creado_en timestamptz not null default now()
);

create table publicaciones (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references usuarios (id) on delete cascade,
  categoria categoria_producto not null,
  cantidad numeric not null check (cantidad > 0),
  unidad text not null,
  precio_total numeric not null check (precio_total >= 0),
  fotos text[] not null default '{}',
  punto_recojo text not null,
  horarios_recojo text not null,
  estado estado_publicacion not null default 'pendiente_pago',
  creado_en timestamptz not null default now(),
  vence_en timestamptz not null default (now() + interval '7 days')
);

create table tarifas_publicacion (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones (id) on delete cascade,
  tramo_aplicado text not null,
  monto numeric not null check (monto >= 0),
  estado_pago estado_pago_tarifa not null default 'pendiente',
  confirmado_por uuid references usuarios (id),
  creado_en timestamptz not null default now(),
  confirmado_en timestamptz
);

create table contactos_interes (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones (id) on delete cascade,
  comprador_id uuid not null references usuarios (id) on delete cascade,
  creado_en timestamptz not null default now()
);

-- Índices para las consultas más frecuentes --------------------------------

create index idx_publicaciones_estado_categoria
  on publicaciones (estado, categoria);

create index idx_publicaciones_vendedor_mes
  on publicaciones (vendedor_id, creado_en);

create index idx_contactos_publicacion
  on contactos_interes (publicacion_id);

-- Vista de métricas de impacto (para el panel de admin, Prompt 5) --------

create view metricas_impacto as
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

-- Row Level Security --------------------------------------------------------

alter table usuarios enable row level security;
alter table publicaciones enable row level security;
alter table tarifas_publicacion enable row level security;
alter table contactos_interes enable row level security;

-- usuarios: cada quien lee/edita su propio registro
create policy "usuarios_select_propio" on usuarios
  for select using (auth.uid() = auth_id);

create policy "usuarios_update_propio" on usuarios
  for update using (auth.uid() = auth_id);

-- publicaciones: cualquiera autenticado puede leer publicaciones activas;
-- el vendedor puede leer/editar solo las suyas en cualquier estado
create policy "publicaciones_select_activas" on publicaciones
  for select using (
    estado = 'activa'
    or vendedor_id in (select id from usuarios where auth_id = auth.uid())
  );

create policy "publicaciones_insert_propio" on publicaciones
  for insert with check (
    vendedor_id in (select id from usuarios where auth_id = auth.uid())
  );

create policy "publicaciones_update_propio" on publicaciones
  for update using (
    vendedor_id in (select id from usuarios where auth_id = auth.uid())
  );

-- tarifas_publicacion: solo admin confirma pagos
create policy "tarifas_select_relacionado" on tarifas_publicacion
  for select using (
    publicacion_id in (
      select id from publicaciones
      where vendedor_id in (select id from usuarios where auth_id = auth.uid())
    )
    or exists (
      select 1 from usuarios where auth_id = auth.uid() and rol = 'admin'
    )
  );

create policy "tarifas_update_solo_admin" on tarifas_publicacion
  for update using (
    exists (select 1 from usuarios where auth_id = auth.uid() and rol = 'admin')
  );

-- contactos_interes: el comprador registra su propio interés
create policy "contactos_insert_propio" on contactos_interes
  for insert with check (
    comprador_id in (select id from usuarios where auth_id = auth.uid())
  );

create policy "contactos_select_relacionado" on contactos_interes
  for select using (
    comprador_id in (select id from usuarios where auth_id = auth.uid())
    or publicacion_id in (
      select id from publicaciones
      where vendedor_id in (select id from usuarios where auth_id = auth.uid())
    )
  );
