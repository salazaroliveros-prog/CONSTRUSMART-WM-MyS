-- Ejecuta ESTO PRIMERO en Dashboard → SQL Editor → Run
-- Crea la función exec_sql para poder correr migraciones via RPC desde Node

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;