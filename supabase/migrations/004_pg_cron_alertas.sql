-- Habilitar extensiones necesarias
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Cron job: cada 5 minutos llama al endpoint de alertas
select cron.schedule(
  'alertas-mundial26',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://ranking-mundial2.vercel.app/api/cron/alertas',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "REEMPLAZAR_CON_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Para verificar que quedó agendado:
-- select * from cron.job;

-- Para pausarlo si necesitas:
-- select cron.unschedule('alertas-mundial26');
