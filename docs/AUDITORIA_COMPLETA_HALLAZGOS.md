# Auditoría Completa — CONSTRUSMART ERP
**Fecha:** 2026-07-17  
**Commit:** 7096dad

---

## Resumen Ejecutivo
- **Schemas duplicados:** 4 entidades con schemas conflictivos
- **CRUD faltante:** 8 funciones add/update no implementadas en store
- **UX/UI gaps:**  skeletons/empty states/paginación en múltiples pantallas
- **Utilidades:** formatos inconsistentes, falta de centralización

---

## 1. Schemas Duplicados (PRIORIDAD ALTA)

| Entidad | Archivo 1 | Archivo 2 | Acción |
|---------|-----------|-----------|--------|
| `proveedorSchema` | `bodega.ts` | `crm.ts` | Unificar en `crm.ts`, eliminar de `bodega.ts` |
| `proveedorFormSchema` | `bodega.ts` | `crm.ts` | Unificar en `crm.ts` |
| `ordenCambioSchema` | `crm.ts` | `financiero.ts` | Unificar en `crm.ts` |
| `hitoSchema` | `calendario.ts` | `seguimiento.ts` | Unificar en `seguimiento.ts` |

**Criterio de unificación:** Mantener el schema con más campos/validaciones y descartar el otro.

---

## 2. Funciones CRUD Faltantes (PRIORIDAD ALTA)

En `src/erp/store/zustandStore.ts` existen `delete*` y `set*` pero faltan `add*` y `update*` para:

- `reglasFactores`
- `normativasDepartamentales`
- `escalasProduccion`
- `estacionalidad`
- `ajustesEstacionalesActividad`
- `aplicacionEscalas`
- `calculosProyecto`
- `cumplimientoNormativo`

**Acción:** Implementar `addX` y `updateX` siguiendo patrón de `addProyecto`/`updateProyecto`.

---

## 3. UX/UI Gaps (PRIORIDAD MEDIA)

### 3.1 Pantallas sin Skeleton Loading
- CalidadCumplimiento.tsx
- CurvasS.tsx
- ErrorLog.tsx

### 3.2 Pantallas sin Empty State
- CRM.tsx (tabla vacía)
- Presupuestos.tsx
- Financiero.tsx (movimientos filtrados)
- DashboardPredictivo.tsx
- RendimientoCampo.tsx
- Weather.tsx

### 3.3 Tablas sin Paginación/Virtual Scroll
- 28+ pantallas con tablas grande sin paginación
- Solo 8 pantallas implementan paginación actualmente

### 3.4 Botones sin Estados
- 38 pantallas sin disabled/loading states en botones de acción

---

## 4. Utilidades (PRIORIDAD MEDIA)

| Hallazgo | Archivo | Acción |
|----------|---------|--------|
| `formatDate` ausente en `src/lib/utils.ts` | `src/lib/utils.ts` | Agregar wrapper/función |
| `formatCurrency` solo acepta `DecimalValue` | `src/lib/decimalUtils.ts` | Agregar overload para `number` |
| `formatPercentage` solo acepta `DecimalValue` | `src/lib/decimalUtils.ts` | Agregar overload para `number` |

---

## 5. Plan de Implementación

### Fase 1 — Schemas (Inmediata)
1. Unificar schemas duplicados
2. Actualizar exports en `index.ts`
3. Ejecutar tests de alineación

### Fase 2 — Store CRUD (Corta)
1. Implementar 8 funciones `add*`/`update*` faltantes
2. Actualizar `MUTATION_TABLE_MAP`
3. Verificar `forceSync` cubre nuevas entidades

### Fase 3 — UX/UI (Media)
1. Agregar skeleton loading a 3 pantallas
2. Implementar empty states en 6 pantallas
3. Agregar disabled/loading states a botones críticos

### Fase 4 — Utilidades (Corta)
1. Centralizar formatos en `src/lib/utils.ts`
2. Actualizar componentes para usar utilidades centralizadas

---

## 6. Estimación de Esfuerzo

| Fase | Horas | Complejidad |
|------|-------|-------------|
| 1. Schemas | 2-3h | Baja |
| 2. CRUD | 4-6h | Media |
| 3. UX/UI | 8-12h | Media-Alta |
| 4. Utilidades | 1-2h | Baja |
| **Total** | **15-23h** | |

---

## 7. Impacto por No Corregir

- **Schemas duplicados:** Conflicto de tipos en runtime, validación inconsistente
- **CRUD faltante:** Funcionalidad rota en módulos avanzados (calidad, normativas, cálculos)
- **UX/UI gaps:** Experiencia de usuario pobre, percepción de sistema incompleto
- **Utilidades:** Código duplicado, mantenimiento difícil

**Conclusión:** Priorizar Fase 1 y 2 para estabilidad, luego Fase 3 para experiencia de usuario.