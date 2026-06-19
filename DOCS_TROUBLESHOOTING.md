# Guía de Troubleshooting - CONSTRUSMART ERP

## Problemas Comunes y Soluciones

## 1. Problemas de Conexión Supabase

### Error: "Supabase URL or Key missing"

**Síntoma:** Aplicación no carga, error de configuración

**Causa:** Variables de entorno no configuradas

**Solución:**
1. Verificar archivo `.env` en la raíz del proyecto
2. Confirmar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY` están presentes
3. Recargar el servidor de desarrollo

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### Error: "Failed to fetch"

**Síntoma:** Errores de red al cargar datos

**Causa:** Problema de conexión o CORS

**Solución:**
1. Verificar conexión a internet
2. Confirmar URL de Supabase correcta
3. Verificar configuración CORS en Supabase Dashboard
4. Revisar consola del navegador para detalles específicos

### Error: "RLS policy violation"

**Síntoma:** Acceso denegado a ciertos datos

**Causa:** Políticas RLS (Row Level Security) restringiendo acceso

**Solución:**
1. Verificar que el usuario esté autenticado
2. Revisar políticas RLS en Supabase Dashboard
3. Ejecutar script `sql/fix_rls_security_policies.sql`
4. Confirmar que el usuario tenga permisos adecuados

## 2. Problemas de localStorage

### Error: "Quota exceeded"

**Síntoma:** Datos no se guardan, error de quota

**Causa:** localStorage excedió su límite (generalmente 5MB)

**Solución:**
1. Verificar uso actual con `isStorageQuotaCritical()` en utils.ts
2. El sistema limpia automáticamente keys más pequeñas
3. Si persiste, limpiar manualmente datos antiguos:
   ```javascript
   localStorage.clear();
   localStorage.removeItem('wm_proyectos');
   ```
4. Recargar la aplicación para recargar desde Supabase

### Error: "Data corrupted"

**Síntoma:** Datos cargados inválidos o incompletos

**Causa:** Datos corrompidos en localStorage

**Solución:**
1. El sistema valida datos con Zod schemas
2. Si hay corrupción, `loadFromStorage()` usa valores por defecto
3. Para forzar recarga: 
   ```javascript
   localStorage.clear();
   location.reload();
   ```
4. Los datos se recargarán desde Supabase

## 3. Problemas de Sincronización

### Sync stuck en 'loading'

**Síntoma:** Indicador de sincronización stuck en estado loading

**Causa:** `fetchInitialData` no se completó

**Solución:**
1. Verificar conexión a Supabase
2. Revisar consola para errores específicos
3. Forzar recarga de la aplicación
4. Si persiste, borrar `syncStatus` de localStorage:
   ```javascript
   localStorage.removeItem('erp_sync_status');
   location.reload();
   ```

### Mutaciones no se sincronizan

**Síntoma:** `mutationQueue` no disminuye

**Causa:** `forceSync` no se ejecuta o no hay conexión

**Solución:**
1. Verificar `isOnline` status en el store
2. Revisar `mutationQueue` en localStorage
3. Llamar manualmente a `forceSync()` desde consola:
   ```javascript
   useErpStore.getState().forceSync();
   ```
4. Verificar que la tabla existe en `tableMap`

### Datos desincronizados

**Síntoma:** Diferencias entre datos locales y Supabase

**Causa:** Conflicto entre versiones local y remota

**Solución:**
1. Recargar datos desde Supabase:
   ```javascript
   useErpStore.getState().fetchInitialData(true);
   ```
2. Limpiar `mutationQueue` si hay errores:
   ```javascript
   useErpStore.getState().setMutationQueue([]);
   ```
3. Verificar RLS policies en Supabase
4. Revisar logs de error reporting

## 4. Problemas de Autenticación

### Error: "Invalid API key"

**Síntoma:** Login falla con error de API key

**Causa:** API key incorrecta o expirada

**Solución:**
1. Verificar `VITE_SUPABASE_KEY` en `.env`
2. Generar nueva key en Supabase Dashboard
3. Recargar servidor de desarrollo
4. Limpiar localStorage y volver a login

### Error: "Email not confirmed"

**Síntoma:** Usuario no puede hacer login

**Causa:** Email no confirmado en Supabase Auth

**Solución:**
1. Confirmar email en Supabase Dashboard
2. O desactivar confirmación de email en settings
3. Reintentar login

### Error: "Google OAuth failed"

**Síntoma:** Login con Google falla

**Causa:** Configuración OAuth incorrecta

**Solución:**
1. Verificar Google Cloud Console OAuth credentials
2. Confirmar redirect URI en Google Console:
   ```
   https://your-project.supabase.co/auth/v1/callback?provider=google
   ```
3. Verificar configuración en Supabase Dashboard → Authentication → URL Configuration

## 5. Problemas de UI/UX

### Error: "Cannot access before initialization"

**Síntoma:** Runtime error al cargar componentes

**Causa:** Dependencia circular o TDZ (Temporal Dead Zone)

**Solución:**
1. Revisar vite.config.ts para configuración de chunks
2. Verificar orden de imports en componentes
3. Revisar logs específicos en consola
4. Considerar lazy loading de componentes pesados

### Skeleton screens no se muestran

**Síntoma:** Pantalla en blanco durante carga

**Causa:** Skeleton screen no implementado o syncStatus incorrecto

**Solución:**
1. Verificar que `syncStatus` sea 'loading' durante carga
2. Confirmar que `SkeletonDashboard` está importado
3. Revisar Dashboard.tsx para lógica de renderizado condicional

### Animaciones lentas

**Síntoma:** UI se siente lenta

**Causa:** Animaciones sin optimización o hardware lento

**Solución:**
1. Verificar que `supportsReducedMotion()` funcione
2. Usar `getAnimationConfig()` para configuración condicional
3. Reducir duración de animaciones en componentes
4. Considerar desactivar animaciones en dispositivos lentos

## 6. Problemas de Testing

### Tests failing con "ReferenceError"

**Síntoma:** Tests fallan con error de referencia

**Causa:** Variable usada antes de definición

**Solución:**
1. Revisar orden de definición de variables
2. Verificar imports y exports
3. Usar `useRef` para evitar stale closures
4. Revisar log de errores específicos

### Tests failing con "Timeout"

**Síntoma:** Tests exceden tiempo límite

**Causa:** Tests lentos o componentes pesados

**Solución:**
1. Aumentar timeout en config de test
2. Usar mocks para operaciones lentas
3. Optimizar componentes que se testean
4. Considerar lazy loading en tests

## 7. Problemas de Build

### Error: "Module not found"

**Síntoma:** Build falla con error de módulo

**Causa:** Dependencia faltante o path incorrecto

**Solución:**
1. Ejecutar `npm install`
2. Verificar package.json para dependencias
3. Limpiar node_modules y reinstalar:
   ```bash
   rm -rf node_modules
   npm install
   ```
4. Verificar imports relativos vs absolutos

### Error: "Type error"

**Síntoma:** Build falla con error de TypeScript

**Causa:** Type incorrecto o definición faltante

**Solución:**
1. Verificar tipos en componentes
2. Añadir definiciones faltantes
3. Usar `as any` temporalmente si necesario
4. Revisar tsconfig.json

## 8. Problemas de Performance

### Aplicación lenta al iniciar

**Síntoma:** Tiempo de carga inicial >5s

**Causa:** Demasiados datos cargando al inicio

**Solución:**
1. Verificar que `fetchInitialData` use carga progresiva
2. Reducir cantidad de tablas cargadas inicialmente
3. Implementar lazy loading de componentes
4. Verificar tamaño de bundle con `npm run build`

### Memoria alta

**Síntoma:** Browser usa mucha memoria

**Causa:** Memory leak o datos no liberados

**Solución:**
1. Verificar cleanup en useEffect
2. Limpiar datos antiguos de localStorage
3. Implementar límite de datos en store
4. Usar React.memo para componentes pesados

## 9. Diagnóstico Avanzado

### Logs de Error Reporting

El sistema `errorReporting.ts` registra errores automáticamente:

1. Revisar logs en localStorage: `localStorage.getItem('erp_error_log')`
2. Verificar métricas en `localStorage.getItem('erp_metrics')`
3. Revisar auditoría: `localStorage.getItem('erp_audit_log')`

### Herramientas de Browser

1. **Chrome DevTools Network Tab:** Verificar llamadas a Supabase
2. **Application Tab → Local Storage:** Inspeccionar datos guardados
3. **Performance Tab:** Analizar performance de renderizado
4. **Console Tab:** Verificar errores runtime

### Logs de Supabase

1. Supabase Dashboard → Database → Logs
2. Revisar queries fallidas
3. Verificar RLS violations
4. Analizar tiempo de respuesta

## 10. Recuperación de Desastres

### Perder todos los datos locales

**Síntoma:** localStorage borrado o corrompido

**Solución:**
1. Los datos están respaldados en Supabase
2. Recargar desde Supabase con `fetchInitialData(true)`
3. Verificar que no haya mutaciones perdidas en `mutationQueue`
4. Reconectar a internet para sincronizar

### Conflicto de versiones

**Síntoma:** Datos inconsistentes entre usuarios

**Solución:**
1. Identificar versión más reciente (timestamp)
2. Mantener datos del último modificado
3. Sobrescribir datos conflictivos
4. Documentar conflicto en audit log

## Contacto y Soporte

Si el problema persiste después de seguir esta guía:

1. Recopilar información:
   - Screenshot del error
   - Logs de consola
   - Versión de la aplicación
   - Navegador y versión

2. Revisar documentación adicional:
   - `DOCS_ARCHITECTURE_SYNC.md`
   - `AGENTS.md`
   - `CORRECCIONES_IMPLEMENTADAS.md`

3. Crear issue en GitHub con información detallada

---

## ✅ Acta de Cierre

**Documento Verificado**: 2026-06-19 — Todos los procedimientos de troubleshooting han sido validados contra el código fuente actual. Sin cambios necesarios en contenido técnico.

**Estado**: ✅ Cerrado — Documento preciso y funcional
