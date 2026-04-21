alter table users
  add column if not exists alertas_activas boolean default null;
