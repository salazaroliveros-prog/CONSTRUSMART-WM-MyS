# 🚀 PLAN MAESTRO DE IMPLEMENTACIÓN

## FASE 0 — Correcciones y SQL (Prioridad Máxima)

### 0.1 Migración SQL completa — Seed data + tablas faltantes
- [ ] Crear migración SQL con seed data (24 insumos, 15 rendimientos, proyectos demo, empleados)
- [ ] Crear tabla `logs_sistema` para auditoría
- [ ] Crear tabla `destajos` (rendimiento real)
- [ ] Crear tabla `cajas_chicas` 
- [ ] Crear tabla `activos_herramientas`
- [ ] Crear tabla `cuadro_comparativo_proveedores`
- [ ] Crear tabla `anticipos`
- [ ] Crear tabla `pagos_proveedores`
- [ ] Crear tabla `ventas_paquetes`
- [ ] Crear tabla `centros_costo`

### 0.2 Validación de precios en sub-renglones
- [ ] Alertas si precio = 0, negativo o excesivo

### 0.3 Catálogo de insumos con trigger de recálculo global
- [ ] Trigger en Supabase que al actualizar precio de insumo, recalcula presupuestos afectados

## FASE 1 — Cadena de Suministro (BLOQUE 2)

### 1.1 Vinculación OC con Explosión de Materiales
- [ ] Alertar si OC excede cantidad permitida según explosión de materiales

### 1.2 Cuadro Comparativo de Proveedores
- [ ] Interfaz para múltiples cotizaciones lado a lado
- [ ] Guardar/seleccionar mejor opción

### 1.3 Entradas de Almacén vs OC
- [ ] Validar cantidades recibidas contra orden de compra

### 1.4 Vales de Salida Destinados a Renglón
- [ ] Insumo imputado a código de renglón específico

### 1.5 Control de Activos y Herramientas
- [ ] Registro de asignación por operador/cuadrilla

## FASE 2 — Campo y Evidencia (BLOQUE 1)

### 2.1 Módulo de Destajos / Rendimiento Real
- [ ] Capturar avance físico diario por cuadrilla vs rendimiento teórico del APU

### 2.2 Carga de Evidencia Fotográfica (Supabase Storage)
- [ ] Reemplazar base64 por Supabase Storage

### 2.3 Plantillas de sub-renglones
- [ ] Precargar sub-renglones típicos por tipo de renglón

## FASE 3 — Admin/Finanzas/Comercial (BLOQUE 3)

### 3.1 Control de Ventas y Paquetes
- [ ] Preventa de unidades, reservaciones, planes de pago

### 3.2 Gestión y Amortización de Anticipos
- [ ] Descuento proporcional en valuaciones

### 3.3 Cajas Chicas de Obra
- [ ] Carga de facturas desde campo con fotografía

### 3.4 Programación de Pagos a Proveedores
- [ ] Vista consolidada por vencimiento

### 3.5 Centros de Costo / Planilla de Destajos / Impuestos
- [ ] Estructura por centros de costo
- [ ] Planilla de destajos (pago semanal por volumen)
- [ ] Automatización de retenciones ISR e IVA

## FASE 4 — Seguridad y Auditoría (BLOQUE 4)

### 4.1 Logs de Auditoría Imborrables
- [ ] Tabla logs_sistema con usuario, acción, valores anteriores/nuevos

---

**TOTAL: ~25+ sub-items**
**Orden:** Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4