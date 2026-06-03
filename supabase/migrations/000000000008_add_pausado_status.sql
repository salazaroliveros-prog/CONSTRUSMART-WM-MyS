-- Add 'pausado' to the estado CHECK constraint in erp_proyectos
-- so projects can be paused between planeacion and finalizado.

ALTER TABLE erp_proyectos
  DROP CONSTRAINT IF EXISTS erp_proyectos_estado_check;

ALTER TABLE erp_proyectos
  ADD CONSTRAINT erp_proyectos_estado_check
    CHECK (estado = ANY (ARRAY['planeacion','ejecucion','pausado','finalizado']));
