# Guía de Verificación Realtime - CONSTRUSMART ERP

## Overview

Realtime de Supabase permite actualizaciones en tiempo real de datos. La ERP usa subscriptions en ~40 tablas críticas para sincronización automática.

---

## Verificación Manual vía SQL

### 1. Verificar que Realtime está habilitado en el proyecto

```sql
-- Verificar que la publicación supabase_realtime existe
SELECT * 
FROM pg_publication 
WHERE pubname = 'supabase_realtime';
```

**Esperado**: Debe existir la publicación `supabase_realtime`

---

### 2. Verificar tablas con Realtime habilitado

```sql
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

**Esperado**: ~40 tablas con prefijo `erp_*`

---

### 3. Verificar tablas que DEBEN tener Realtime

#### Tablas operacionales críticas:
```sql
SELECT tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN (
    'erp_proyectos',
    'erp_movimientos',
    'erp_ordenes_compra',
    'erp_proveedores',
    'erp_presupuestos',
    'erp_avances',
    'erp_vales_salida',
    'erp_cotizaciones_negocio',
    'erp_publicaciones_muro',
    'erp_notificaciones',
    'erp_eventos_calendario',
    'erp_ordenes_cambio',
    'erp_error_log',
    'erp_insumos_base',
    'erp_departamentos_gt',
    'erp_municipios_gt'
  );
```

**Esperado**: Todas estas tablas deben estar listadas

---

## Verificación via Supabase Dashboard

### Método 1: Replication Section

1. Ir a Supabase Dashboard → Replication
2. Verificar que `supabase_realtime` exista
3. Click en `supabase_realtime`
4. Verificar tablas habilitadas

### Método 2: Table Editor

1. Ir a Table Editor
2. Seleccionar tabla (ej: `erp_proyectos`)
3. Ver icono de "lightning" ⚡ al lado del nombre
4. Click en el icono → "Realtime"
5. Verificar que esté habilitado

---

## Pruebas de Funcionalidad Realtime

### Test 1: Verificar subscription en código

En `src/erp/store.tsx`, verificar que las tablas estén en el array `subs`:

```typescript
const subs: string[] = [
  'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
  'erp_ordenes_compra', 'erp_proveedores', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
  'erp_hitos', 'erp_riesgos', 'erp_licitaciones', 'erp_cotizaciones_negocio',
  'erp_vales_salida', 'erp_no_conformidades', 'erp_incidentes', 'erp_planos',
  'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros', 'erp_pagos_proveedor',
  'erp_destajos', 'erp_recepciones', 'erp_centros_costo', 'erp_seguimiento',
  'erp_bitacora', 'erp_pruebas_laboratorio', 'erp_liberaciones_partida',
  'erp_plantillas_proyectos', 'erp_presupuestos', 'erp_avances',
  'erp_muro', 'erp_ventas_paquetes', 'erp_proyecto_weather',
  'erp_eventos_calendario', 'erp_ordenes_cambio', 'erp_notificaciones',
  'erp_error_log', 'erp_insumos_base',
  'erp_departamentos_gt', 'erp_municipios_gt',
];
```

### Test 2: Verificar connection

En consola del navegador, después de login:

```javascript
// Verificar que el cliente se conectó
console.log('Realtime connected:', supabase.realtime.isConnected());
```

### Test 3: Prueba de actualización en tiempo real

1. Abrir la app en dos pestañas del navegador
2. Login en ambas pestañas con el mismo usuario
3. En pestaña 1: Crear un nuevo proyecto
4. En pestaña 2: Verificar que el proyecto aparece automáticamente
5. **Esperado**: El proyecto aparece en pestaña 2 sin refresh

---

## Habilitar Realtime en Tablas Faltantes

Si alguna tabla crítica no tiene Realtime habilitado:

```sql
-- Habilitar realtime en tabla específica
ALTER PUBLICATION supabase_realtime ADD TABLE nombre_tabla;

-- Ejemplo para proyectos
ALTER PUBLICATION supabase_realtime ADD TABLE erp_proyectos;

-- Ejemplo para departamentos (nueva)
ALTER PUBLICATION supabase_realtime ADD TABLE erp_departamentos_gt;

-- Ejemplo para municipios (nueva)
ALTER PUBLICATION supabase_realtime ADD TABLE erp_municipios_gt;
```

---

## Verificación de Subscription Events

### Verificar qué eventos se escuchan

En el código de `src/erp/store.tsx`, verificar que se escuchen todos los eventos:

```typescript
channel
  .on('postgres_changes', { 
    event: '*',  // Escucha INSERT, UPDATE, DELETE
    schema: 'public', 
    table 
  }, payload => {
    // Manejar el evento
  })
```

### Test de eventos específicos

```sql
-- INSERT: Insertar un registro
INSERT INTO erp_proyectos (nombre, cliente, tipologia, estado, presupuesto_total, avance_fisico, avance_financiero, fecha_inicio, fecha_fin, user_id)
VALUES ('Test Realtime', 'Test Client', 'residencial', 'planeacion', 100000, 0, 0, '2026-07-19', '2026-12-31', auth.uid());

-- UPDATE: Actualizar el registro
UPDATE erp_proyectos SET nombre = 'Test Realtime Updated' WHERE nombre = 'Test Realtime';

-- DELETE: Eliminar el registro
DELETE FROM erp_proyectos WHERE nombre = 'Test Realtime Updated';
```

**Esperado**: Cada operación debe reflejarse en la app en tiempo real

---

## Troubleshooting

### Problema: "Subscription failed"

**Causa**: Realtime no habilitado en la tabla  
**Solución**:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE nombre_tabla;
```

### Problema: "Updates not reflected in UI"

**Causa**: Evento no escuchado o handler incorrecto  
**Solución**:
- Verificar que el evento sea `INSERT`, `UPDATE` o `DELETE`
- Verificar que el handler en `store.tsx` procese el evento correctamente
- Verificar console para errores

### Problema: "Connection refused"

**Causa**: Realtime no habilitado en el proyecto  
**Solución**:
- Ir a Supabase Dashboard → Replication
- Habilitar `supabase_realtime`
- Agregar tablas necesarias

### Problema: "Slow updates"

**Causa**: Demasiadas subscriptions o tablas con muchos datos  
**Solución**:
- Limitar subscriptions a tablas críticas
- Usar filtros en subscriptions (por user_id)
- Considerar usar RLS para filtrar datos

---

## Optimización de Realtime

### Filtrar subscriptions por usuario

En lugar de escuchar todos los cambios, filtrar por user_id:

```typescript
// En store.tsx
channel
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'erp_proyectos',
    filter: `user_id=eq.${user.id}`  // Solo cambios del usuario actual
  }, payload => {
    // Manejar evento
  })
```

### Usar broadcast en lugar de database changes

Para eventos que no necesitan persistencia:

```typescript
// Enviar broadcast
supabase.channel('custom-channel').send({
  type: 'broadcast',
  event: 'notification',
  payload: { message: 'Nuevo proyecto creado' }
});

// Escuchar broadcast
supabase.channel('custom-channel')
  .on('broadcast', { event: 'notification' }, payload => {
    console.log('Broadcast:', payload);
  })
  .subscribe();
```

---

## Checklist de Verificación Realtime

### Configuración:
- [ ] Publicación `supabase_realtime` existe
- [ ] ~40 tablas críticas tienen Realtime habilitado
- [ ] Departamentos y municipios tienen Realtime habilitado (nuevo)
- [ ] Tablas de usuario tienen Realtime habilitado
- [ ] Tablas de referencia tienen Realtime habilitado

### Funcionalidad:
- [ ] App se conecta a Realtime al login
- [ ] INSERT se refleja en tiempo real
- [ ] UPDATE se refleja en tiempo real
- [ ] DELETE se refleja en tiempo real
- [ ] Offline mode funciona cuando no hay conexión

### Performance:
- [ ] No hay延迟 perceptible en updates
- [ ] No hay errores de conexión
- [ ] No hay memory leaks en subscriptions

---

## Scripts de Verificación Automatizada

### Script completo de verificación:

```sql
-- Verificar todas las tablas con realtime
DO $$
DECLARE
  table_record RECORD;
  has_realtime BOOLEAN;
BEGIN
  RAISE NOTICE '=== VERIFICACIÓN REALTIME ===';
  
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename LIKE 'erp_%'
    ORDER BY tablename
  LOOP
    -- Verificar si tiene realtime
    SELECT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND tablename = table_record.tablename
    ) INTO has_realtime;
    
    -- Reportar
    IF has_realtime THEN
      RAISE NOTICE '✅ %s: Realtime habilitado', table_record.tablename;
    ELSE
      RAISE NOTICE '❌ %s: Realtime NO habilitado', table_record.tablename;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== TABLAS CRÍTICAS ===';
  
  -- Verificar tablas críticas específicas
  SELECT tablename
  FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime'
    AND tablename IN (
      'erp_proyectos', 'erp_movimientos', 'erp_ordenes_compra',
      'erp_proveedores', 'erp_presupuestos', 'erp_avances',
      'erp_notificaciones', 'erp_departamentos_gt', 'erp_municipios_gt'
    );
END $$;
```

Ejecutar este script en SQL Editor para verificar todas las tablas de una vez.

---

## Recomendaciones de Seguridad

### Best Practices:
1. ✅ Habilitar RLS en tablas con Realtime
2. ✅ Filtrar subscriptions por user_id cuando sea posible
3. ✅ No usar Realtime en tablas con datos sensibles sin RLS
4. ✅ Monitorear logs de Realtime regularmente
5. ✅ Desconectar subscriptions cuando el usuario hace logout

### Monitoreo:
```sql
-- Verificar errores de realtime
SELECT *
FROM pg_stat_statements
WHERE query LIKE '%realtime%'
ORDER BY calls DESC
LIMIT 10;
```

---

**Última actualización**: 2026-07-19
**Total tablas con Realtime**: ~40 tablas `erp_*`
**Nuevas tablas**: erp_departamentos_gt, erp_municipios_gt
**Estado**: Todas las tablas críticas deben tener Realtime habilitado
