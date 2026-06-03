# 🛡️ CHECKLIST DE REFUERZO GENERAL — ERP CONSTRUSMART

> **Propósito**: Mapeo a grano fino de áreas débiles y vulnerabilidades en el código fuente, con instrucciones claras de implementación.
> **Formato**: `- [ ]` pendiente | `- [x]` completado — **Actualizar en el código y marcar aquí al completar cada item.**

---

## 🔴 NIVEL CRÍTICO — Vulnerabilidades de Seguridad

### CRIT-01: XSS en export.ts (generación PDF/HTML)
- **Archivo**: `src/erp/export.ts`
- **Problema**: Datos de usuario insertados directamente en HTML/PDF sin sanitizar. Permite inyección XSS.
- **Instrucciones**:
  1. Abrir `src/erp/export.ts`
  2. Envolver todo texto de usuario con `sanitizarTexto()` de `@/lib/security`
  3. Validar que las URLs de imágenes usen esquemas permitidos (https://, data:image/)
  4. Escapar caracteres HTML en nombres de proyecto, cliente, descripciones
  5. Agregar `Content-Security-Policy` en PDF generado
- [ ] Implementar sanitización XSS en export.ts
- [ ] Validar URLs de imágenes en exportación

### CRIT-02: Path Traversal en storage.ts
- **Archivo**: `src/lib/storage.ts`
- **Problema**: Función `deleteFile()` permite path traversal si `fileName` contiene `../`
- **Instrucciones**:
  1. Abrir `src/lib/storage.ts`
  2. Agregar validación `path.normalize(fileName) !== fileName` o `fileName.includes('..')`
  3. Restringir caracteres peligrosos en nombres de archivo
  4. Usar whitelist de extensiones permitidas
- [ ] Implementar protección path traversal en storage.ts
- [ ] Restringir extensiones de archivo permitidas

### CRIT-03: Datos sensibles en localStorage sin cifrar (ChecklistCalidad)
- **Archivo**: `src/erp/components/ChecklistCalidad.tsx`
- **Problema**: Firmas digitales y fotos almacenadas como base64 en localStorage sin cifrado.
- **Instrucciones**:
  1. Abrir `src/erp/components/ChecklistCalidad.tsx`
  2. Envolver datos sensibles con `btoa()` simple o usar Web Crypto API para cifrado AES-GCM
  3. Limpiar localStorage después de enviar a Supabase
  4. No almacenar fotos base64 directamente — usar URLs de Supabase Storage
- [ ] Cifrar datos sensibles en localStorage
- [ ] Migrar fotos/firmas a Supabase Storage

### CRIT-04: Exposición de key de Supabase en cliente
- **Archivo**: `src/lib/supabase.ts`
- **Problema**: La `anon key` se expone en el bundle del cliente (necesario para Supabase, pero debe rotarse si se sospecha compromiso).
- **Instrucciones**:
  1. Verificar que `VITE_SUPABASE_KEY` en `.env` sea la `anon key` (NO la `service_role key`)
  2. Configurar RLS para restringir lo que la anon key puede hacer
  3. Verificar que no hay `service_role key` en `.env`
  4. Rotar la anon key en Supabase Dashboard si hay sospecha
- [ ] Verificar que solo se usa anon key (no service_role)
- [ ] Confirmar políticas RLS activas para proteger datos

### CRIT-05: RPC verificar_rol_usuario no ejecutado en Supabase
- **Referencia**: `supabase/migrations/202606030005_rls_rpc_verificar_rol.sql`
- **Problema**: La función RPC necesaria para `security.ts` no está creada en la base de datos.
- **Instrucciones**:
  1. Abrir Supabase Dashboard → SQL Editor
  2. Copiar contenido de `supabase/migrations/202606030005_rls_rpc_verificar_rol.sql`
  3. Ejecutar el SQL
  4. Verificar: `SELECT * FROM verificar_rol_usuario();` debe funcionar
- [ ] Ejecutar RPC verificar_rol_usuario en Supabase

---

## 🟠 NIVEL ALTO — Inconsistencias DB / Types

### DB-01: Discrepancias entre tipos locales y esquema Supabase
- **Archivos**: `src/erp/types.ts` vs `src/types/supabase.ts` vs migraciones SQL
- **Problema**: Campos que existen en TypeScript pero no en DB, y viceversa. Causa errores silenciosos en CRUD.
- **Instrucciones**:
  1. Comparar cada interface de `src/erp/types.ts` con schema real en Supabase
  2. Para cada campo faltante en DB, decidir: agregar columna SQL o eliminar del type
  3. Para cada campo extra en DB no mapeado, agregar al type
- [ ] Audit completo de alineación types ↔ DB
- [ ] Corregir discrepancias encontradas

### DB-02: Tablas del store no en migraciones RLS
- **Problema**: `erp_avances`, `erp_licitaciones` referenciadas en `store.tsx` pero con políticas RLS insuficientes.
- **Instrucciones**:
  1. Buscar referencias a `erp_avances` y `erp_licitaciones` en migraciones RLS
  2. Si faltan políticas, agregarlas
  3. Verificar que `addAvance`, `deleteAvance` en store.tsx respeten permisos
- [ ] Agregar políticas RLS para tablas faltantes

---

## 🟡 NIVEL MEDIO — Rendimiento y UX

### REND-01: Listener leak en efectos
- **Archivos**: Múltiples componentes con `useEffect` sin cleanup
- **Instrucciones**:
  1. Revisar cada `useEffect` que agregue event listeners o intervalos
  2. Verificar que la función de cleanup remueva correctamente
  3. Prestar atención a: charts, calendario, notificaciones periódicas
- [ ] Revisar y corregir listener leaks en componentes

### REND-02: Cálculos sin useMemo en componentes pesados
- **Archivos**: `Charts.tsx`, `AvanceObraModal.tsx`, `CubicacionAutomatica.tsx`
- **Instrucciones**:
  1. Identificar cálculos derivados que se ejecutan en cada render
  2. Envolver con `useMemo` cuando el input no cambie frecuentemente
  3. Usar `React.memo` en componentes hijos que reciben props estables
- [ ] Agregar useMemo en cálculos costosos
- [ ] Agregar React.memo en componentes puros

### REND-03: Polling RPC cada 30s con consumo de cuota
- **Archivo**: `src/erp/store.tsx` línea 677
- **Instrucciones**:
  1. Reducir intervalo de 30s a 60s o 120s
  2. Solo verificar rol si la UI está visible (usar `document.hidden`)
  3. Cachear resultado de RPC para evitar llamadas innecesarias
- [x] Evaluar y optimizar polling de RPC

---

## 🟢 NIVEL BAJO — Calidad de Código

### CODE-01: Variables definidas pero no usadas
- **Archivos**: `CubicacionAutomatica.tsx` (_peso, _total), `ConteoCiclico.tsx` (_materialSeleccionado), `GanttChart.tsx` (_addDays)
- **Instrucciones**:
  1. Buscar variables con prefijo `_` que no se usan
  2. Eliminar o implementar la funcionalidad faltante
- [ ] Limpiar variables muertas

### CODE-02: Import `React` innecesario en React 18+
- **Archivos**: `src/contexts/AppContext.tsx` línea 1
- **Instrucciones**:
  1. Eliminar `import React from 'react'` donde solo se usa JSX
  2. Verificar que `tsconfig.json` tenga `"jsx": "react-jsx"`
- [ ] Eliminar imports React innecesarios

### CODE-03: Falta de validación Zod en datos entrantes
- **Archivos**: `Charts.tsx`, `Calendar.tsx`, varios screens
- **Problema**: No se validan datos recibidos de props o contexto antes de usarlos
- **Instrucciones**:
  1. En componentes que reciben arrays, validar que no sean null/undefined
  2. Usar schemas Zod para validar datos críticos
  3. Valores por defecto para evitar NaN
- [ ] Agregar validación de props en componentes críticos

---

## ⚙️ NIVEL CONFIGURACIÓN — DevOps y Build

### CONF-01: Dependencias desactualizadas
- **Instrucciones**:
  1. `jsdom` v22 → v24+: `npm install jsdom@latest --save-dev`
  2. `vitest` v1 → v2+: `npm install vitest@latest --save-dev`
  3. `react-signature-canvas` alpha: migrar a `react-signature-canvas` estable o `@robrez/react-signature-canvas`
  4. `web-ifc` v0.0.77: evaluar estabilidad
- [ ] Actualizar dependencias desactualizadas

### CONF-02: Falta script de typecheck
- **Instrucciones**:
  1. Agregar a `package.json` scripts: `"typecheck": "tsc --noEmit"`
  2. Agregar `"typecheck": "tsc --noEmit"` a CI
- [ ] Agregar script typecheck

### CONF-03: Falta `engines` en package.json
- **Instrucciones**:
  1. Agregar `"engines": { "node": ">=18.0.0" }` en `package.json`
  2. Agregar `"engines": { "npm": ">=9.0.0" }`
- [ ] Agregar engines en package.json

---

## 🚀 PENDIENTES PRODUCCIÓN (del TODO_CHECKLIST.md original)

### DEPLOY-01: Ejecutar migraciones RLS en Supabase
- **Archivos**: `supabase/migrations/202606030001` al `202606030006`
- **Instrucciones**:
  1. Ejecutar en orden:
     - `202606030001_rls_complete_coverage.sql`
     - `202606030002_rls_policies_by_role.sql`
     - `202606030003_rls_delta.sql`
     - `202606030004_rls_alignment.sql`
     - `202606030005_rls_rpc_verificar_rol.sql`
     - `202606030005_unique_admin.sql`
     - `202606030006_align_app_to_db.sql`
     - `202606030006_combined_rls_policies.sql`
  2. Verificar cada una con `SELECT * FROM pg_policies`
- [ ] Ejecutar migraciones RLS en Supabase

### DEPLOY-02: Configurar secrets en GitHub
- **Instrucciones**:
  1. Ir a GitHub → Settings → Secrets and variables → Actions
  2. Agregar:
     - `VITE_SUPABASE_URL` = URL del proyecto
     - `VITE_SUPABASE_KEY` = anon key
     - `VERCEL_TOKEN` = token de Vercel
- [ ] Configurar secrets en GitHub

### DEPLOY-03: Push a GitHub
- **Instrucciones**:
  1. `git add .`
  2. `git commit -m "fix: refuerzo general de seguridad y alineación DB"`
  3. `git push origin main`
- [ ] Push a GitHub

---

## 📊 RESUMEN DE PROGRESO

| Categoría | Total Items | Completados | % |
|-----------|------------|-------------|---|
| 🔴 Crítico | 5 | 0 | 0% |
| 🟠 Alto | 2 | 0 | 0% |
| 🟡 Medio | 3 | 1 | 33% |
| 🟢 Bajo | 3 | 0 | 0% |
| ⚙️ Config | 3 | 0 | 0% |
| 🚀 Deploy | 3 | 0 | 0% |
| **TOTAL** | **19** | **1** | **5%** |

> **Instrucciones**: Al completar cada item en el código, cambiar `- [ ]` a `- [x]` y actualizar el resumen de progreso.