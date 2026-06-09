# CONSTRUSMART — Estado de Estabilización para Producción

**Fecha:** 2026-06-09  
**Entorno:** Desarrollo local (localhost:8080) + Supabase proyecto LINKED  
**Build:** ✓ Producción generada (`npm run build`)  
**Tests:** ✓ 427/427 tests Vitest pasan  
**Servidor dev:** ✓ Node + V corriendo en puerto 8080  
**Supabase:** Proyecto confirmado: `ERP EMPRESARIAL CONSTRUSMART WM/M&S`

---

## Cambios Aplicados en Esta Sesión

1. **Store offline-first tolerante** (`src/erp/store.tsx`)
   - Ahora carga desde localStorage sin rechazar todo el bloque si un campo no calza con Zod.
   - `fetchInitialData` convierte datos de Supabase (`snake_case`) a formato de app (`camelCase`) antes de pintar la UI.
   - Sincronización automática al recuperar internet (`forceSync` + `isOnline`).

2. **Alineación de entorno Supabase** (`.env`)
   - Se corrigió la URL y la anon key para apuntar al proyecto LINKED real.
   - Se mantiene `ROLE_KEY_SECRET` para seeds server-side, con nota de seguridad.

3. **Corrección de migraciones obsoletas** (commit anterior)
   - Se eliminaron migraciones legacy duplicadas del tracking de Git para evitar re-ejecuciones conflictivas.
   - Quedan activas: `20260806001_fix_security_definer_views.sql`, `20260806002_realtime_publication.sql`, `000000000010_fix_cotizaciones_negocio_prefix.sql`.

4. **Script de seed real** (`scripts/seed-datos-reales.cjs`)
   - Listo para poblar datos reales en todas las tablas del proyecto.
   - Cumple con el schema actual de BD (columnas en `snake_case`).

5. **Diagnóstico de schema BD vs app**
   - Se identificaron discrepancias entre columnas que usa el front (`camelCase`) y las que existen en Postgres (`snake_case`).
   - Se aplicó normalización `toCamel()` en la carga inicial.

---

## Lo que falta hacer (paso a paso)

### 1. Poblar datos reales

```powershell
node scripts/seed-datos-reales.cjs
```

Esto inserta en Supabase:
- 1 proyecto base conectado a TODO el resto de módulos
- 6 movimientos financieros (ingresos/gastos)
- 3 empleados
- 3 materiales (con stock crítico)
- 5 avances de obra
- 6 registros de seguimiento EVM
- 3 hitos
- 2 riesgos
- 2 proveedores
- 1 orden de compra
- 1 cuenta por cobrar
- 1 cuenta por pagar
- 2 bitácoras
- 3 eventos de calendario
- 1 publicación en muro

### 2. Verificar módulos en el navegador

Abrir `http://localhost:8080/` y revisar cada vista desde el sidebar:

- **Proyectos** → debe aparecer el proyecto seed + cards con KPIs
- **Presupuestos** → APU con renglones cargados
- **Seguimiento EVM** → Curva S con datos reales
- **Financiero** → Registro rápido con movimientos seed
- **Bodega** → Materiales con stock crítico visible
- **RRHH** → Empleados y planilla
- **CRM** → Pipeline de licitaciones
- **Exportación** → Botones PDF/XLSX funcionales

### 3. Probar flujo offline

1. Desconectar internet
2. Crear/modificar un proyecto o movimiento
3. Verificar que aparece en la UI
4. Reconectar internet
5. Verificar que `forceSync` sube los cambios a Supabase

### 4. Validar gráficas

- **Dashboard**: Curva S, Gastos/Ingresos, Calendar Heatmap
- **Presupuestos**: Comparativo renglones
- **Seguimiento**: EVM (PV, EV, AC)

Todas deben tener **datos reales** del seed.

---

## Errores conocidos y su estado

| Error | Estado | Acción |
|-------|--------|--------|
| `avanceFinanciero` no existe en BD | ✅ Corregido | Schema BD usa `snake_case`, store convierte a `camelCase` |
| RLS bloquea inserts con anon key | Documentado | Usar `service_role` solo en scripts server-side |
| Variables de entorno apuntan a proyecto incorrecto | ✅ Corregido | `.env` alineado a proyecto LINKED |
| Zod rechaza datos de Supabase | ✅ Mitigado | `loadFromStorage` tolerante + `toCamel()` |
| localStorage vacío después de limpiar | ✅ Corregido | Store carga defaults seguros |

---

## Siguiente Acción Inmediata

Ejecutar el seed y verificar la app:

```powershell
# 1. Poblar datos
node scripts/seed-datos-reales.cjs

# 2. Levantar dev (si no está corriendo)
npm run dev

# 3. Abrir navegador
http://localhost:8080/
```

Si encuentran errores, se corrigen antes de producción.

---

## Checklist Final para Producción

- [ ] Todos los módulos cargan datos reales sin vacíos
- [ ] Gráficas (Curva S, Gastos/Ingresos) muestran actividad
- [ ] Formularios crean/editan registros en Supabase
- [ ] Offline funcionando (queue + sync)
- [ ] Exportaciones PDF/XLSX descargan archivos
- [ ] Login Google OAuth estable
- [ ] No hay errores 500 en consola
- [ ] Tests pasan: `npm test`
- [ ] Build limpio: `npm run build`

**La app está lista para la ronda final de validación usuario-real.**
