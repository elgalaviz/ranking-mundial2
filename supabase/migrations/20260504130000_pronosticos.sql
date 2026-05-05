create table if not exists pronosticos (
  id               uuid primary key default gen_random_uuid(),
  whatsapp_id      text not null,
  equipo_local     text not null,
  equipo_visitante text not null,
  pronostico       text not null check (pronostico in ('local', 'empate', 'visitante')),
  momio            numeric not null default 1,
  fecha_partido    timestamptz,
  acerto           boolean default null,
  notificado       boolean not null default false,
  created_at       timestamptz not null default now()
);

create index on pronosticos (whatsapp_id);
create index on pronosticos (notificado) where notificado = false;
create index on pronosticos (acerto) where acerto is null;
