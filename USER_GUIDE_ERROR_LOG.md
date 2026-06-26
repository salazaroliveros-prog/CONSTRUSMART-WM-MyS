# Guía de Usuario: Log de Errores

## Acceso
- Ruta: `/error-log`
- Rol requerido: Administrador
- Acceso desde: Sidebar → Sistema → Error Log

## Funcionalidades

### KPIs
- **Total Errores**: Cantidad total de errores registrados
- **Abiertos**: Errores pendientes de resolución
- **Resueltos**: Errores ya solucionados
- **Críticos**: Errores de severidad `critical` no resueltos

### Filtros
- Búsqueda por mensaje, código o componente
- Severidad: critical, error, warning, info, debug
- Estado: Abierto / Resuelto
- Proyecto
- Rango de fecha

### Gráfico de Errores por Tipo
Muestra la distribución de errores agrupados por tipo (database, api, ui, auth, sync, etc.) con barras horizontales.

### Acciones en Tabla
- **Ver**: Abre modal con detalle completo del error (stack trace, contexto, etc.)
- **Resolver**: Abre modal para ingresar notas de resolución y marcar como resuelto

### Acciones Masivas
- **Resolver Seleccionados**: Marca múltiples errores como resueltos
- **Eliminar Seleccionados**: Elimina errores seleccionados
- **Exportar CSV**: Descarga los errores filtrados en formato CSV
- **Limpiar Antiguos**: Elimina errores resueltos mayores a N días (por defecto 30)

### Modal de Resolución
- Ingresa notas opcionales describiendo cómo se resolvió el error
- Confirma para marcar como resuelto
- Las notas quedan registradas en el historial del error

## Solución de Problemas
- Si no ves errores, verifica que los filtros no estén activos
- Los errores de sincronización (forceSync) se registran automáticamente
- Para ver errores de la base de datos, verifica la conexión Supabase
