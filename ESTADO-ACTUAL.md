# CONSTRUSMART — Estado Actual de Validación

## ✅ LISTO AHORA

| Item | Estado |
|------|--------|
| Servidor dev | Corriendo en `localhost:8080` (PID 29860) |
| Build producción | ✓ `npm run build` exitoso |
| Tests | ✓ 427/427 tests pasan |
| .env | Proyecto LINKED confirmado: `neygzluxugodiwcuctbj` |
| Store | Offline-first + `toCamel()` implementado |
| Schema BD | Documentado: `snake_case` en BD, `camelCase` en app |

## 🔧 CORRECCIONES APLICADAS

1. **Conversión snake_case ↔ camelCase** en `fetchInitialData`
   - `toSnake()`: app → BD
   - `toCamel()`: BD → app
   - Archivo: `src/erp/store.tsx` líneas 238-262

2. **Carga inicial tolerante** (no Zod estricto)
   - Usa `loadFromStorage` + parseo seguro
   - No descarta toda la entidad si un campo falla

3. **Variables de entorno al proyecto correcto**
   - Antes: `wakzdqcnhdnfpnapshjz` (Oregon, App 1)
   - Ahora: `neygzluxugodiwcuctbj` (Virginia, LINKED)

4. **Migraciones limpias**
   - Eliminadas migraciones duplicadas del tracking de Git
   - Quedan activas las 4 migraciones canónicas

## 📋 PRÓXIMOS PASOS (para completar)

### 1. Poblar datos en Supabase
```powershell
node scripts/seed-datos-reales.cjs
```

Esto inserta: 1 proyecto + 6 movimientos + 3 empleados + 3 materiales + 5 avances + 6 seguimientos EVM + 3 hitos + 2 riesgos + 2 proveedores + 1 OC + 1 cuenta cobrar + 1 cuenta pagar + 2 bitácoras + 3 eventos + 1 publicación muro.

### 2. Verificar en el navegador
Abrir `http://localhost:8080/` y navegar por sidebar:
- Proyectos → debe mostrar el proyecto seed
- Presupuestos → APU con renglones
- Seguimiento EVM → Curva S con datos
- Financiero → movimientos seed
- Bodega → materiales con stock
- RRHH → empleados
- CRM → licitaciones

### 3. Si datos no aparecen
Verificar consola del navegador (F12). Si hay:
- `500 Internal Server Error` → RLS bloqueando (normal en dev)
- `Schema cache` → esquema BD desactualizado (ejecutar: `npx supabase db push`)
- `Validation failed` → datos no cumplen Zod (revisar `safeLogger.ts`)

### 4. Probar offline
1. Chrome DevTools → Network → Offline
2. Crear/modificar algo en la app
3. Reconectar → verificar `[Sync]` en consola

## ⚠️ NOTA SOBRE PLAYWRIGHT

El sandbox de Playwright NO puede acceder a `localhost:8080` desde este entorno. Las pruebas E2E deben ejecutarse desde el navegador real del sistema.

Para probar manualmente:
1. Abrir Chrome/Edge
2. Ir a `http://localhost:8080/`
3. Login con Google OAuth
4. Navegar por cada módulo del sidebar
5. Verificar que los datos del seed aparezcan

---
**Fecha:** 2026-06-09  
**Build:** dist/assets/index-*.js + chunks code-splitted  
**Servidor:** http://172.17.42.180:8080/ (interno) / http://localhost:8080/ (host)
