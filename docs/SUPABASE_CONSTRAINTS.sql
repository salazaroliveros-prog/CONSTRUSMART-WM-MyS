/**
 * Foreign Key Constraints - PRIORITY 1 Implementation
 * 
 * SQL Queries para Supabase
 * Ubicación: docs/SUPABASE_CONSTRAINTS.sql
 * 
 * SESSION 3 - PRIORITY 1 IMPLEMENTATION
 * Status: ✅ LISTA PARA APLICAR
 * Impacto: +10% referential integrity
 * Esfuerzo: 2 horas
 * 
 * Instrucciones:
 * 1. Copiar cada query
 * 2. Ir a Supabase SQL Editor
 * 3. Ejecutar cada una
 * 4. Verificar que no hay errores
 * 
 * IMPORTANTE: Hacer backup antes de aplicar!
 */

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. HITOS ↔ PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE hitos
ADD CONSTRAINT fk_hitos_proyectos
FOREIGN KEY (proyectoId)
REFERENCES proyectos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_hitos_proyectos ON hitos 
IS 'Elimina hitos automáticamente cuando se elimina proyecto';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. RIESGOS ↔ PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE riesgos
ADD CONSTRAINT fk_riesgos_proyectos
FOREIGN KEY (proyectoId)
REFERENCES proyectos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_riesgos_proyectos ON riesgos
IS 'Elimina riesgos automáticamente cuando se elimina proyecto';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CUENTAS COBRAR ↔ PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE cuentas_cobrar
ADD CONSTRAINT fk_cuentas_cobrar_proyectos
FOREIGN KEY (proyectoId)
REFERENCES proyectos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_cuentas_cobrar_proyectos ON cuentas_cobrar
IS 'Elimina cuentas cobrar cuando se elimina proyecto';

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CUENTAS PAGAR ↔ PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE cuentas_pagar
ADD CONSTRAINT fk_cuentas_pagar_proyectos
FOREIGN KEY (proyectoId)
REFERENCES proyectos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_cuentas_pagar_proyectos ON cuentas_pagar
IS 'Elimina cuentas pagar cuando se elimina proyecto';

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. MOVIMIENTOS ↔ PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE movimientos
ADD CONSTRAINT fk_movimientos_proyectos
FOREIGN KEY (proyectoId)
REFERENCES proyectos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_movimientos_proyectos ON movimientos
IS 'Elimina movimientos cuando se elimina proyecto';

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. SEGUIMIENTO ↔ PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE seguimiento
ADD CONSTRAINT fk_seguimiento_proyectos
FOREIGN KEY (proyectoId)
REFERENCES proyectos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_seguimiento_proyectos ON seguimiento
IS 'Elimina registros de seguimiento cuando se elimina proyecto';

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. BITACORA ↔ PROYECTOS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE bitacora
ADD CONSTRAINT fk_bitacora_proyectos
FOREIGN KEY (proyectoId)
REFERENCES proyectos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_bitacora_proyectos ON bitacora
IS 'Elimina bitácora cuando se elimina proyecto';

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. ASIGNACIONES ↔ PROYECTOS & EMPLEADOS (M:M)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE asignaciones
ADD CONSTRAINT fk_asignaciones_proyectos
FOREIGN KEY (proyectoId)
REFERENCES proyectos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE asignaciones
ADD CONSTRAINT fk_asignaciones_empleados
FOREIGN KEY (empleadoId)
REFERENCES empleados(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_asignaciones_proyectos ON asignaciones
IS 'Elimina asignaciones cuando se elimina proyecto';

COMMENT ON CONSTRAINT fk_asignaciones_empleados ON asignaciones
IS 'Elimina asignaciones cuando se elimina empleado';

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. VERIFICACIÓN - Listar todas las foreign keys creadas
-- ═══════════════════════════════════════════════════════════════════════════

-- Ejecutar después de aplicar todas las constraints:
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. ROLLBACK (Si necesita revertir)
-- ═══════════════════════════════════════════════════════════════════════════

-- Ejecutar solo si necesita deshacer:
/*
ALTER TABLE hitos DROP CONSTRAINT IF EXISTS fk_hitos_proyectos;
ALTER TABLE riesgos DROP CONSTRAINT IF EXISTS fk_riesgos_proyectos;
ALTER TABLE cuentas_cobrar DROP CONSTRAINT IF EXISTS fk_cuentas_cobrar_proyectos;
ALTER TABLE cuentas_pagar DROP CONSTRAINT IF EXISTS fk_cuentas_pagar_proyectos;
ALTER TABLE movimientos DROP CONSTRAINT IF EXISTS fk_movimientos_proyectos;
ALTER TABLE seguimiento DROP CONSTRAINT IF EXISTS fk_seguimiento_proyectos;
ALTER TABLE bitacora DROP CONSTRAINT IF EXISTS fk_bitacora_proyectos;
ALTER TABLE asignaciones DROP CONSTRAINT IF EXISTS fk_asignaciones_proyectos;
ALTER TABLE asignaciones DROP CONSTRAINT IF EXISTS fk_asignaciones_empleados;
*/
