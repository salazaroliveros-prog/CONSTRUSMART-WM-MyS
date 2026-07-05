# Guía de Troubleshooting - CONSTRUSMART ERP

## Errores Comunes

### "proyectoId es requerido"
- **Causa**: Se intentó crear un registro sin especificar el proyecto
- **Solución**: Asegúrate de seleccionar un proyecto en el formulario
- **Prevención**: Los schemas Zod ahora validan proyectoId como obligatorio

### Error de Sincronización (forceSync)
- **Causa**: La cola de mutaciones no pudo enviarse a Supabase
- **Verifica**:
  1. Conexión a internet
  2. Sesión de Supabase activa
  3. Tabla de destino existe en Supabase
- **Error FK 23503**: El registro referencia un proyecto que no existe en la DB
  - Solución: Verifica que el proyectoId existe en erp_proyectos

### Error de Parsing Zod
- **Causa**: Datos en localStorage no coinciden con el schema esperado
- **Solución**: Limpiar localStorage y recargar desde Supabase
- **Prevención**: Los schemas están alineados con la DB

### Pantalla en Blanco
- **Causa**: Error en lazy loading de componente
- **Solución**: Verificar consola del navegador para errores específicos
- **Prevención**: Cada screen está envuelta en ErrorBoundary

## Log de Errores
- Todos los errores se registran automáticamente en `erp_error_log`
- Accede desde Sidebar → Sistema → Error Log
- Los errores de sincronización se loguean con tipo `database` y severidad `error`

## Problemas de Rendimiento
- Dashboard lento: Usar filtro por proyecto para reducir datos
- Exportación PDF: Grandes volúmenes de datos pueden tardar
- Sincronización: La cola de mutaciones se procesa en lotes
