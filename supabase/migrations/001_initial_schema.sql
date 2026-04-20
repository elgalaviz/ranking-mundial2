-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  whatsapp_id       text unique not null,
  phone             text unique not null,
  name              text,
  country_code      text,
  city_hint         text,
  plan              text not null default 'free' check (plan in ('free', 'premium')),
  consultas_hoy     int not null default 0,
  consultas_reset   date not null default current_date,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PARTIDOS
-- ─────────────────────────────────────────
create table if not exists partidos (
  id               uuid primary key default gen_random_uuid(),
  equipo_local     text not null,
  equipo_visitante text not null,
  fecha_utc        timestamptz not null,
  estadio          text,
  ciudad           text,
  fase             text,
  grupo            text,
  alerta_enviada   boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- REGISTROS_WHATSAPP
-- ─────────────────────────────────────────
create table if not exists registros_whatsapp (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references users(id) on delete cascade,
  partido_id     uuid references partidos(id) on delete set null,
  tipo_mensaje   text not null,
  enviado_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PATROCINADORES
-- ─────────────────────────────────────────
create table if not exists patrocinadores (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  mensaje_texto  text,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- QUINIELA_PICKS (fase 2 — estructura vacía)
-- ─────────────────────────────────────────
create table if not exists quiniela_picks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  partido_id uuid references partidos(id) on delete cascade,
  pick_local int,
  pick_visit int,
  puntos     int default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────
create index on partidos (fecha_utc);
create index on partidos (alerta_enviada);
create index on registros_whatsapp (user_id);
create index on registros_whatsapp (partido_id);
create index on quiniela_picks (user_id);
