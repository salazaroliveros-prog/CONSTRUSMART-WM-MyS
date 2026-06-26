# Monitoreo Post-Deployment - CONSTRUSMART ERP

## Primera Hora
- [ ] Revisar consola del navegador por errores
- [ ] Verificar que ErrorLog captura errores
- [ ] Verificar que forceSync funciona
- [ ] Monitorear mutaciones fallidas en cola

## Primer Día
- [ ] Revisar `erp_error_log` en Supabase por errores nuevos
- [ ] Verificar que las cards de Dashboard muestran datos correctos
- [ ] Confirmar que auditoría registra cambios
- [ ] Recopilar feedback de usuarios

## Primera Semana
- [ ] Ejecutar script de validación de integridad
- [ ] Revisar queries lentas en Supabase
- [ ] Optimizar índices si es necesario
- [ ] Cleanup de errores antiguos (> 30 días)

## Dashboard de Monitoreo
- **Integridad de Datos**: Verificar 0 registros huérfanos
- **Performance**: Verificar sync < 5s
- **Error Log**: Verificar que todos los errores se registran
- **Auditoría**: Confirmar que cambios críticos quedan registrados

## Alertas
- Si hay > 10 errores críticos en 1 hora → revisar inmediatamente
- Si hay mutaciones con retryCount > 3 → investigar causa
- Si syncStatus = 'error' por más de 30 minutos → escalar a DevOps
