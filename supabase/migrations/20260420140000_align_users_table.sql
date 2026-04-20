-- MIGRACIÓN PARA ALINEAR LA TABLA `users` CON LA LÓGICA DEL WEBHOOK

-- 1. Agregar las columnas que el webhook intenta insertar para usuarios nuevos.
--    Estas columnas también son necesarias para que el cron job de alertas funcione.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country_code VARCHAR(4);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city_hint VARCHAR;

-- 2. Renombrar 'fecha_reset' a 'consultas_reset' para que coincida con el código.
ALTER TABLE public.users RENAME COLUMN fecha_reset TO consultas_reset;