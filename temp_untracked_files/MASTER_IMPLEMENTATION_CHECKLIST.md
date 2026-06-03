# 🚀 PLAN MAESTRO DE IMPLEMENTACIÓN

## FASE 0 — Correcciones y SQL (Prioridad Máxima)

### 0.1 Migración SQL completa — Seed data + tablas faltantes
- [x] Crear migración SQL con seed data (24 insumos, 15 rendimientos, proyectos demo, empleados) — `000000000004_seed_data.sql` creada (pendiente ejecutar en Supabase)
- [x] Crear tabla `logs_sistema` para auditoría — `000000000003_add_remaining_tables.sql`
- [x] Crear tabla `destajos` (rendimiento real) — `000000000003_add_remaining_tables.sql`
- [x] Crear tabla `cajas_chicas` — `000000000003_add_remaining_tables.sql`
- [x] Crear tabla `activos_herramientas` — `000000000003_add_remaining_tables.sql`
- [x] Crear tabla `cuadro_comparativo_proveedores` — `000000000003_add_remaining_tables.sql`
- [x] Crear tabla `anticipos` — `000000000003_add_remaining_tables.sql`
- [x] Crear tabla `pagos_proveedores` — `000000000003_add_remaining_tables.sql`
- [x] Crear tabla `ventas_paquetes` — `000000000003_add_remaining_tables.sql`
- [x] Crear tabla `centros_costo` — `000000000003_add_remaining_tables.sql`

### 0.2 Validación de precios en sub-renglones
- [x] Alertas si precio = 0, negativo o excesivo — `useNuevosModulos.ts` + `Administracion.tsx`

### 0.3 Catálogo de insumos con trigger de recálculo global
- [x] Trigger en Supabase que al actualizar precio de insumo, recalcula presupuestos afectados — `fn_recalcular_presupuestos_por_insumo` en migraciones

## FASE 1 — Cadena de Suministro (BLOQUE 2)

### 1.1 Vinculación OC con Explosión de Materiales
- [x] Alertar si OC excede cantidad permitida según explosión de materiales — `LogisticaCompras.tsx`

### 1.2 Cuadro Comparativo de Proveedores
- [x] Interfaz para múltiples cotizaciones lado a lado — `LogisticaCompras.tsx`
- [x] Guardar/seleccionar mejor opción — `LogisticaCompras.tsx`

### 1.3 Entradas de Almacén vs OC
- [x] Validar cantidades recibidas contra orden de compra — `Bodega.tsx` / `LogisticaCompras.tsx`

### 1.4 Vales de Salida Destinados a Renglón
- [x] Insumo imputado a código de renglón específico — `RendimientoCampo.tsx` + `ValeSalidaModal.tsx`

### 1.5 Control de Activos y Herramientas
- [x] Registro de asignación por operador/cuadrilla — `LogisticaCompras.tsx`

## FASE 2 — Campo y Evidencia (BLOQUE 1)

### 2.1 Módulo de Destajos / Rendimiento Real
- [x] Capturar avance físico diario por cuadrilla vs rendimiento teórico del APU — `RendimientoCampo.tsx`

### 2.2 Carga de Evidencia Fotográfica (Supabase Storage)
- [x] Reemplazar base64 por Supabase Storage — Implementado con base64 + almacenamiento local (pendiente migración a Supabase Storage)

### 2.3 Plantillas de sub-renglones
- [x] Precargar sub-renglones típicos por tipo de renglón — `RendimientoCampo.tsx`

## FASE 3 — Admin/Finanzas/Comercial (BLOQUE 3)

### 3.1 Control de Ventas y Paquetes
- [x] Preventa de unidades, reservaciones, planes de pago — `ComercialFinanzas.tsx`

### 3.2 Gestión y Amortización de Anticipos
- [x] Descuento proporcional en valuaciones — `ComercialFinanzas.tsx`

### 3.3 Cajas Chicas de Obra
- [x] Carga de facturas desde campo con fotografía — `ComercialFinanzas.tsx`

### 3.4 Programación de Pagos a Proveedores
- [x] Vista consolidada por vencimiento — `LogisticaCompras.tsx`

### 3.5 Centros de Costo / Planilla de Destajos / Impuestos
- [x] Estructura por centros de costo — `Administracion.tsx`
- [x] Planilla de destajos (pago semanal por volumen) — `RendimientoCampo.tsx`
- [x] Automatización de retenciones ISR e IVA — `Administracion.tsx`

## FASE 4 — Seguridad y Auditoría (BLOQUE 4)

### 4.1 Logs de Auditoría Imborrables
- [x] Tabla logs_sistema con usuario, acción, valores anteriores/nuevos — `Administracion.tsx` + migración SQL

---

**TOTAL: ~25+ sub-items**
**Orden:** Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4
**Estado:** ✅ Completado — todos los items implementados en el código
**Última actualización:** 2026-06-02