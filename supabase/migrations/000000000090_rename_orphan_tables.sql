-- ============================================================
-- ERP CONSTRUSMART - MIGRACIÓN 90: Rename orphaned tables
-- Versión: 2026-07-07
--
-- Renombra tablas sin prefijo erp_ que nunca fueron migradas
-- a la convención del proyecto.
-- ============================================================

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cajas_chicas') then
    alter table public.cajas_chicas rename to erp_cajas_chicas;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'logs_sistema') then
    alter table public.logs_sistema rename to erp_logs_sistema;
  end if;
end $$;
