# Plan de Implementación — Auditoría Completa CONSTRUSMART
**Fecha:** 2026-07-17  
**Commit:** 7096dad

---

## Objetivo
Corregir todas las inconsistencias detectadas en la auditoría completa de schemas, store, UX/UI y utilidades.

---

## Fase 1 — Unificación de Schemas (PRIORIDAD ALTA)

### 1.1 proveedorSchema / proveedorFormSchema
**Acción:** Mantener versión de `crm.ts`, eliminar de `bodega.ts`  
**Criterio:** Versión CRM tiene más campos (nit, telefono con regex, email, direccion, plazoPago)  
**Archivos a modificar:**
- `src/erp/store/schemas/bodega.ts` — eliminar líneas 58-78 y 80-91
- `src/erp/store/schemas/crm.ts` — mantener como está
- `src/erp/store/schemas/index.ts` — actualizar exports

### 1.2 ordenCambioSchema
**Acción:** Mantener versión de `crm.ts`, eliminar de `financiero.ts`  
**Criterio:** Versión CRM es más completa (monto, fechas, estados)  
**Archivos a modificar:**
- `src/erp/store/schemas/financiero.ts` — eliminar schema duplicado
- `src/erp/store/schemas/crm.ts` — mantener

### 1.3 hitoSchema
**Acción:** Mantener versión de `seguimiento.ts`, eliminar de `calendario.ts`  
**Criterio:** Versión seguimiento tiene campos más detallados  
**Archivos a modificar:**
- `src/erp/store/schemas/calendario.ts` — eliminar schema duplicado
- `src/erp/store/schemas/seguimiento.ts` — mantener

---

## Fase 2 — Implementar CRUD Faltante (PRIORIDAD ALTA)

### 2.1 Funciones a implementar en `src/erp/store/zustandStore.ts`

Para cada entidad, implementar `addX` y `updateX` siguiendo patrón de `addProyecto`:

1. `addReglaFactor` / `updateReglaFactor`
2. `addNormativaDepartamental` / `updateNormativaDepartamental`
3. `addEscalaProduccion` / `updateEscalaProduccion`
4. `addEstacionalidad` / `updateEstacionalidad`
5. `addAjusteEstacionalActividad` / `updateAjusteEstacionalActividad`
6. `addAplicacionEscala` / `updateAplicacionEscala`
7. `addCalculoProyecto` / `updateCalculoProyecto`
8. `addCumplimientoNormativo` / `updateCumplimientoNormativo`

**Patrón a seguir:**
```typescript
addX: (entity) => {
  const normalized = { ...entity, id: entity.id || uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  set(state => ({ ...state, x: [...state.x, normalized] }));
  queueMutation({ type: 'INSERT', table: 'erp_x', payload: normalized });
  return normalized;
}
```

### 2.2 Actualizar `MUTATION_TABLE_MAP` en `store.tsx`
Verificar que todas las nuevas funciones estén mapeadas a sus tablas correspondientes.

---

## Fase 3 — Mejoras UX/UI (PRIORIDAD MEDIA)

### 3.1 Skeleton Loading
Agregar a:
- `CalidadCumplimiento.tsx`
- `CurvasS.tsx`
- `ErrorLog.tsx`

### 3.2 Empty States
Implementar en:
- `CRM.tsx` — tabla vacía
- `Presupuestos.tsx` — sin presupuestos
- `Financiero.tsx` — sin movimientos
- `DashboardPredictivo.tsx` — sin predicciones
- `RendimientoCampo.tsx` — sin datos
- `Weather.tsx` — sin datos climáticos

### 3.3 Paginación/Virtual Scroll
Evaluar implementar en tablas con >50 filas:
- `Proyectos.tsx`
- `Presupuestos.tsx`
- `ErrorLog.tsx`
- `Movimientos` en Financiero

### 3.4 Estados de Botones
Agregar `disabled` y `loading` en:
- Botones de eliminación
- Botones de envío de formularios
- Botones de acciones masivas

---

## Fase 4 — Utilidades (PRIORIDAD MEDIA)

### 4.1 Centralizar formatos
En `src/lib/utils.ts`:
```typescript
export function formatDate(iso: string, locale = 'es-GT'): string {
  return new Date(iso).toLocaleDateString(locale);
}

export function formatCurrency(value: number, currency = 'GTQ'): string {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
```

### 4.2 Actualizar componentes
Reemplazar formateos inline por llamadas a utils.

---

## Cronograma

| Fase | Duración | Dependencias |
|------|----------|--------------|
| 1. Schemas | 2-3h | Ninguna |
| 2. CRUD | 4-6h | Fase 1 completa |
| 3. UX/UI | 8-12h | Ninguna (paralela) |
| 4. Utilidades | 1-2h | Ninguna (paralela) |

**Inicio:** Inmediato  
**Finalización estimada:** 15-23 horas de desarrollo

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Schemas duplicados causan conflictos en runtime | Alta | Alto | Unificar antes de implementar CRUD |
| CRUD incompleto rompe flujos existentes | Media | Alto | Tests unitarios por cada función |
| UX/UI inconsistentes | Media | Bajo | Design system + componentes base |
| Formatos inconsistentes | Alta | Medio | Centralizar en utils |

---

## Próximos Pasos

1. Ejecutar Fase 1 (schemas) — 2-3h
2. Ejecutar Fase 2 (CRUD) — 4-6h
3. Ejecutar Fase 3 (UX/UI) — 8-12h
4. Ejecutar Fase 4 (utilidades) — 1-2h
5. Ejecutar suite completa de tests
6. Verificar build de producción