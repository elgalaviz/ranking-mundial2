CREATE OR REPLACE FUNCTION count_distinct_quiniela_users()
RETURNS integer AS $$
  SELECT count(DISTINCT user_id)::integer FROM public.quiniela_picks;
$$ LANGUAGE SQL STABLE;