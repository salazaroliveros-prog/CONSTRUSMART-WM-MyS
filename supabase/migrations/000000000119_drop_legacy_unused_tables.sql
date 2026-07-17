-- ============================================================
-- MIGRACIÓN 119: Eliminar tablas legacy sin uso en la aplicación
-- ============================================================
-- Fecha: 2026-07-17
-- Propósito: Remover tablas creadas en migraciones tempranas que
-- fueron reemplazadas por versiones normalizadas en el esquema
-- actual y que no tienen referencias en el código fuente.
-- ============================================================

-- ============================================================
-- 1) pagos_proveedores (reemplazada por erp_pagos_proveedor)
-- ============================================================
DROP TABLE IF EXISTS public.pagos_proveedores;

-- ============================================================
-- 2) cotizaciones (reemplazada por erp_cotizaciones_negocio)
-- ============================================================
DROP TABLE IF EXISTS public.cotizaciones;
