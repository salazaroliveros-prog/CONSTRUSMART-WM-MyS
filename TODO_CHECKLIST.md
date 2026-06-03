# TODO_CHECKLIST.md

## Deuda Técnica
- [x] Eliminar `src/erp/screens/_tmp_presupuestos_patch.txt` y asegurar que la lógica esté integrada correctamente.
- [x] Refactorizar migraciones: Consolidar los archivos `fix_...` en una única migración limpia para evitar conflictos futuros.
- [x] Limpiar `/src/functions/crm-dispatcher`: Eliminar bundles versionados y establecer un proceso de build automatizado en el CI/CD.
- [x] Fix ArrowUpDown import en BasePrecios.tsx (error crítico)
- [x] Agregar fechaActualizacion a interface InsumoBase

## Seguridad y Auditoría
- [x] Realizar una auditoría de las políticas RLS actuales contra los requerimientos de acceso de roles definidos en `rpc_verificar_rol_usuario.sql`.
- [x] Verificar que no existan credenciales o llaves API expuestas en el código fuente.
- [ ] Crear/ ejecutar RPC `verificar_rol_usuario` en Supabase (faltante para security.ts)

## Calidad y Pruebas
- [x] Ampliar la cobertura de pruebas unitarias en `src/erp/__tests__` para cubrir cálculos críticos de presupuestos y movimientos de inventario.

## Alineación Esquema Base de Datos vs Aplicación
- [x] Corregir `erp_empleados` (soportar `proyecto_ids` array).
- [x] Agregar `proyecto_ids` a `erp_materiales`.
- [x] Agregar `factura` a `erp_movimientos`.
- [x] Agregar `participantes` a `erp_eventos_calendario`.
- [x] Agregar `fotos` y `firma` a `erp_bitacora`.
- [x] Agregar `factor_sobrecosto` (jsonb) a `erp_proyectos`.

## Pendientes Producción
- [ ] Ejecutar migraciones RLS en Supabase (202606030001-0005)
- [ ] Configurar secrets en GitHub (VITE_SUPABASE_URL, VITE_SUPABASE_KEY, VERCEL_TOKEN)
- [ ] Push a GitHub: `git push origin main`
