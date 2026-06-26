# Guía de Pasos Manuales - Mejoras de Base de Datos CONSTRUSMART ERP

> ✅ **ESTADO: COMPLETADO (SESIÓN-14 — 2026-06-26)** — Toda la automatización disponible está implementada. Los pasos manuales descritos aquí son configuración de Supabase Dashboard que debe realizar el administrador del proyecto.

Este documento proporciona instrucciones detalladas paso a paso para completar las configuraciones manuales restantes en el Dashboard de Supabase.

---

## PASO 1: Configurar Backups Automáticos (Phase 4.1)

### Objetivo
Configurar backups automáticos y recuperación point-in-time (PITR) en Supabase.

### Pasos:

#### 1.1 Acceder al Dashboard de Supabase
1. Ir a https://supabase.com/dashboard
2. Iniciar sesión con tu cuenta
3. Seleccionar el proyecto: `neygzluxugodiwcuctbj`

#### 1.2 Configurar Backups Automáticos
1. En el panel izquierdo, navegar a **Settings** > **Database**
2. Buscar la sección **Backups**
3. Verificar que **Automated Backups** esté habilitado (está incluido en el plan Pro)
4. Configurar la retención de backups:
   - Establecer **Backup Retention** a **30 days** (o según preferencia)
   - Esto permite restaurar cualquier punto dentro de los últimos 30 días

#### 1.3 Habilitar Point-in-Time Recovery (PITR)
1. En la misma sección de Backups
2. Buscar **Point-in-Time Recovery**
3. Habilitar PITR si está disponible en tu plan
4. Configurar:
   - **WAL Retention**: 7 days (mínimo recomendado)
   - Esto permite restaurar a cualquier momento específico dentro del período de retención

#### 1.4 Configurar Schedule de Backups
1. Los backups automáticos de Supabase se ejecutan diariamente
2. No requiere configuración adicional
3. Los backups se realizan automáticamente a las 00:00 UTC

#### 1.5 Verificar Configuración
1. Ir a **Database** > **Backups**
2. Verificar que aparezcan backups recientes en la lista
3. Confirmar que la retención esté configurada correctamente

### Resultado Esperado
- ✅ Backups automáticos activos
- ✅ Retención de 30 días configurada
- ✅ PITR habilitado (si el plan lo permite)
- ✅ Lista de backups visible en el Dashboard

---

## PASO 2: Probar Procedimiento de Restauración (Phase 4.2)

### Objetivo
Verificar que el procedimiento de restauración de backups funciona correctamente.

### Requisitos Previos
- Un entorno de staging (opcional pero recomendado)
- O crear un proyecto de prueba en Supabase

### Pasos:

#### 2.1 Preparar Entorno de Prueba
**Opción A: Usar el mismo proyecto (CUIDADO - Solo para pruebas rápidas)**
1. Crear una tabla de prueba:
   ```sql
   CREATE TABLE test_restore (
     id SERIAL PRIMARY KEY,
     data TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
2. Insertar datos de prueba:
   ```sql
   INSERT INTO test_restore (data) VALUES ('test1'), ('test2'), ('test3');
   ```

**Opción B: Usar proyecto de staging (RECOMENDADO)**
1. Crear un nuevo proyecto en Supabase llamado `construsmart-staging`
2. Restaurar el backup del proyecto principal al staging

#### 2.2 Ejecutar Backup Manual (para prueba)
1. En el Dashboard, ir a **Database** > **Backups**
2. Hacer clic en **Create backup** (si está disponible)
3. Esperar a que se complete el backup
4. Anotar la fecha/hora del backup

#### 2.3 Simular Pérdida de Datos
1. Eliminar datos de prueba:
   ```sql
   DELETE FROM test_restore;
   ```
2. Verificar que la tabla esté vacía:
   ```sql
   SELECT * FROM test_restore;
   ```

#### 2.4 Restaurar desde Backup
1. En el Dashboard, ir a **Database** > **Backups**
2. Buscar el backup creado en el paso 2.2
3. Hacer clic en **Restore**
4. Seleccionar **Restore to a new database** (recomendado) o **Overwrite** (cuidado)
5. Confirmar la restauración
6. Esperar a que se complete

#### 2.5 Verificar Restauración
1. Conectarse a la base de datos restaurada
2. Verificar los datos:
   ```sql
   SELECT * FROM test_restore;
   ```
3. Confirmar que los datos estén restaurados correctamente

#### 2.6 Documentar Procedimiento
1. Actualizar el archivo `BACKUP_RESTORATION_GUIDE.md` con:
   - Tiempo promedio de restauración
   - Cualquier problema encontrado
   - Notas específicas del proyecto

### Resultado Esperado
- ✅ Procedimiento de restauración verificado
- ✅ Tiempo de restauración documentado
- ✅ Guía actualizada con notas reales

---

## PASO 3: Configurar Encriptación en Reposo (Phase 5.2)

### Objetivo
Verificar y documentar la configuración de encriptación de datos en reposo.

### Información Importante
Supabase tiene encriptación en reposo habilitada por defecto. Este paso es principalmente de verificación y documentación.

### Pasos:

#### 3.1 Verificar Encriptación de Disco
1. En el Dashboard, ir a **Settings** > **Database**
2. Buscar la sección **Encryption**
3. Verificar que **Encryption at Rest** esté habilitado
4. Nota: Supabase usa AES-256 para encriptación de disco

#### 3.2 Verificar TLS/SSL para Conexiones
1. En el Dashboard, ir a **Settings** > **Database**
2. Buscar **Connection Info**
3. Verificar que la conexión requiera SSL/TLS
4. Supabase usa TLS 1.3 por defecto

#### 3.3 Verificar Encriptación de Secrets
1. En el Dashboard, ir a **Settings** > **API**
2. Revisar que las API keys estén almacenadas de forma segura
3. Supabase usa Vault para almacenar secrets

#### 3.4 Documentar Configuración
Crear un archivo `ENCRYPTION_SETTINGS.md` con:
```markdown
# Configuración de Encriptación - CONSTRUSMART ERP

## Encriptación en Reposito
- **Estado**: Habilitado por defecto (Supabase)
- **Algoritmo**: AES-256
- **Aplicación**: Todos los datos en disco

## Encriptación en Tránsito
- **Protocolo**: TLS 1.3
- **Certificado**: Managed por Supabase
- **Requerimiento**: SSL obligatorio para todas las conexiones

## Secrets Management
- **Almacenamiento**: Supabase Vault
- **API Keys**: Rotación automática recomendada
- **Service Role Key**: Almacenada en .env (no commit a git)

## Configuración Adicional
- No se requiere configuración manual
- Supabase maneja todas las capas de encriptación
- Cumplimiento: SOC 2, HIPAA, GDPR (según plan)
```

#### 3.5 Verificar Conexión Segura desde Aplicación
1. Revisar el código de conexión en la aplicación
2. Verificar que use la URL HTTPS:
   ```javascript
   const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
   ```
3. Confirmar que no se deshabilite SSL en la configuración

### Resultado Esperado
- ✅ Verificación de encriptación completada
- ✅ Documentación de configuración creada
- ✅ Confirmación de conexiones seguras

---

## PASO 4: Configurar Monitoreo de Performance de Queries (Phase 6.2)

### Objetivo
Habilitar y configurar el monitoreo de performance de queries en Supabase.

### Pasos:

#### 4.1 Habilitar Query Performance Insights
1. En el Dashboard, ir a **Database** > **Performance**
2. Verificar que **Query Performance Insights** esté habilitado
3. Si no está habilitado, hacer clic en **Enable**
4. Esto habilita `pg_stat_statements` en PostgreSQL

#### 4.2 Configurar Alertas de Slow Queries
1. En el Dashboard, ir a **Settings** > **Alerts**
2. Hacer clic en **New Alert**
3. Configurar alerta para slow queries:
   - **Type**: Database
   - **Metric**: Query Duration
   - **Threshold**: > 1000ms (1 segundo)
   - **Condition**: Average over 5 minutes
   - **Notification**: Email (tu email)
4. Guardar la alerta

#### 4.3 Configurar Alertas de CPU/Memory
1. En la misma sección de Alerts
2. Crear alerta para CPU:
   - **Type**: Database
   - **Metric**: CPU Usage
   - **Threshold**: > 80%
   - **Condition**: Average over 5 minutes
3. Crear alerta para Memory:
   - **Type**: Database
   - **Metric**: Memory Usage
   - **Threshold**: > 80%
   - **Condition**: Average over 5 minutes

#### 4.4 Configurar Monitoreo de Table Size
1. Usar el script ya creado: `monitor-table-growth.mjs`
2. Agregar a cron job o scheduler:
   - **Linux/Mac**: Agregar a crontab
     ```bash
     crontab -e
     # Agregar línea para ejecutar semanalmente
     0 0 * * 0 cd /ruta/al/proyecto && npm run monitor:table-growth >> logs/monitor.log 2>&1
     ```
   - **Windows**: Usar Task Scheduler
     - Crear tarea programada
     - Trigger: Weekly, Sunday 00:00
     - Action: `npm run monitor:table-growth`

#### 4.5 Verificar Monitoreo Activo
1. Ejecutar el script de monitoreo:
   ```bash
   npm run monitor:table-growth
   ```
2. Verificar salida correcta
3. Ir al Dashboard > **Database** > **Performance**
4. Verificar que aparezcan métricas de queries

#### 4.6 Revisar Slow Queries (si existen)
1. En el Dashboard, ir a **Database** > **Performance**
2. Buscar la sección **Slow Queries**
3. Revisar las queries más lentas
4. Si hay queries > 1s, considerar optimización:
   - Agregar índices
   - Reescribir queries
   - Usar paginación

#### 4.7 Documentar Configuración
Crear archivo `PERFORMANCE_MONITORING.md`:
```markdown
# Monitoreo de Performance - CONSTRUSMART ERP

## Alertas Configuradas
- **Slow Queries**: > 1000ms
- **CPU Usage**: > 80%
- **Memory Usage**: > 80%

## Scripts de Monitoreo
- **Table Growth**: `npm run monitor:table-growth`
- **Ejecución**: Semanal (crontab/Task Scheduler)

## Métricas a Monitorear
- Tamaño de tablas (< 100,000 rows)
- Tamaño en disco (< 100 MB)
- Duración de queries (< 1000ms)
- Uso de CPU (< 80%)
- Uso de memoria (< 80%)

## Procedimiento de Optimización
1. Revisar slow queries mensualmente
2. Identificar top 10 queries más lentas
3. Agregar índices si es necesario
4. Reescribir queries ineficientes
5. Documentar cambios
```

### Resultado Esperado
- ✅ Query Performance Insights habilitado
- ✅ Alertas configuradas (slow queries, CPU, memory)
- ✅ Script de monitoreo programado
- ✅ Documentación de configuración creada

---

## RESUMEN DE PASOS MANUALES

| Paso | Fase | Descripción | Tiempo Estimado | Prioridad |
|------|------|-------------|-----------------|-----------|
| 1 | 4.1 | Configurar backups automáticos | 15 min | ALTA |
| 2 | 4.2 | Probar restauración de backups | 30 min | MEDIA |
| 3 | 5.2 | Verificar encriptación en reposo | 10 min | MEDIA |
| 4 | 6.2 | Configurar monitoreo de performance | 20 min | MEDIA |

**Tiempo Total Estimado**: 1 hora 15 minutos

---

## VERIFICACIÓN FINAL

Después de completar todos los pasos manuales:

1. ✅ Ejecutar `npm run monitor:table-growth` - Debe mostrar todos los OK
2. ✅ Ejecutar `npm run backup:verify` - Debe pasar todas las verificaciones
3. ✅ Verificar que las alertas estén activas en el Dashboard
4. ✅ Revisar que los backups se estén creando diariamente
5. ✅ Confirmar que la encriptación esté habilitada

## CONTACTO DE SOPORTE

Si encuentras problemas durante la configuración:
- Documentación de Supabase: https://supabase.com/docs
- Soporte de Supabase: https://supabase.com/support
- Revisar logs en: Dashboard > Database > Logs
