# Auditoría de Alineación Supabase ↔ App

**Proyecto:** CONSTRUSMART ERP  
**Fecha:** 2026-07-08  
**Ref:** `neygzluxugodiwcuctbj`  
**Propósito:** Verificar que la base de datos remota en Supabase esté alineada con lo que la aplicación espera en tablas, políticas y configuración.

---

## 1. Tablas Verificadas (40)

| # | Tabla | Estado en DB | Comentario |
|---|-------|-------------|------------|
| 1 | `erp_proyectos` | ✅ Existe | RLS protegida |
| 2 | `erp_movimientos` | ✅ Existe | |
| 3 | `erp_empleados` | ✅ Existe | |
| 4 | `erp_materiales` | ✅ Existe | |
| 5 | `erp_ordenes_compra` | ✅ Existe | |
| 6 | `erp_proveedores` | ✅ Existe | |
| 7 | `erp_presupuestos` | ✅ Existe | |
| 8 | `erp_avances` | ✅ Existe | |
| 9 | `erp_hitos` | ✅ Existe | |
| 10 | `erp_riesgos` | ✅ Existe | |
| 11 | `erp_incidentes` | ✅ Existe | |
| 12 | `erp_planos` | ✅ Existe | |
| 13 | `erp_rfis` | ✅ Existe | |
| 14 | `erp_submittals` | ✅ Existe | |
| 15 | `erp_activos` | ✅ Existe | |
| 16 | `erp_cuadros` | ✅ Existe | |
| 17 | `erp_pagos_proveedor` | ✅ Existe | |
| 18 | `erp_destajos` | ✅ Existe | |
| 19 | `erp_recepciones` | ✅ Existe | |
| 20 | `erp_centros_costo` | ✅ Existe | |
| 21 | `erp_plantillas_proyectos` | ✅ Existe | |
| 22 | `erp_cotizaciones_negocio` | ✅ Existe | |
| 23 | `erp_licitaciones` | ✅ Existe | |
| 24 | `erp_vales_salida` | ✅ Existe | |
| 25 | `erp_no_conformidades` | ✅ Existe | |
| 26 | `erp_pruebas_laboratorio` | ✅ Existe | |
| 27 | `erp_liberaciones_partida` | ✅ Existe | |
| 28 | `erp_eventos_calendario` | ✅ Existe | |
| 29 | `erp_bitacora` | ✅ Existe | |
| 30 | `erp_seguimiento` | ✅ Existe | |
| 31 | `erp_notificaciones` | ✅ Existe | |
| 32 | `erp_error_log` | ✅ Existe | |
| 33 | `erp_proyecto_weather` | ✅ Existe | |
| 34 | `erp_ventas_paquetes` | ✅ Existe | |
| 35 | `erp_insumos_base` | ✅ Existe | |
| 36 | `erp_cuentas_cobrar` | ✅ Existe | |
| 37 | `erp_cuentas_pagar` | ✅ Existe | |
| 38 | `erp_ordenes_cambio` | ✅ Existe | |
| 39 | `erp_muro` | ✅ Existe | **VIEW**, no tabla base |
| 40 | **`erp_publicaciones_muro`** | ❌ **NO EXISTE** | Debe crearse |

**Resumen:** 39/40 tablas existen ✅; 1 tabla faltante ❌.

---

## 2. Políticas RLS

- **SELECT sin autenticación:** Bloqueado en todas las tablas operacionales (401 Unauthorized con anon key). Correcto.
- **Service role key:** Puede acceder a todas las tablas. Correcto para `forceSync`.
- **Conclusión:** RLS operativo. No se detectaron tablas expuestas sin autenticación.

---

## 3. Configuración de Auth

**Site URL:** Debe apuntar a `https://construsmart-wm2026.vercel.app`  
**Redirect URLs:** Debe incluir `https://construsmart-wm2026.vercel.app/**`  
**CORS Origins:** Debe incluir `https://construsmart-wm2026.vercel.app`

> **Nota:** Estas configuraciones se realizan desde el Dashboard de Supabase (Auth → Settings). No se pudieron verificar automáticamente vía API REST.

---

## 4. Migraciones

No se puede determinar desde acá cuáles migraciones están aplicadas exactamente; el comando `supabase db remote commit` o `supabase db diff` requiere autenticación por DB password, no disponible. Se recomienda:

```bash
cd supabase
npx supabase link --project-ref neygzluxugodiwcuctbj
# Luego: npx supabase db remote commit
```

---

## 5. Tabla Faltante: `erp_publicaciones_muro`

La app escribe publicaciones del muro de obra en esta tabla. Como no existe, los INSERT de `addPublicacionMuro` fallan en `forceSync`.

### SQL de creación

```sql
CREATE TABLE public.erp_publicaciones_muro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.erp_proyectos(id) ON DELETE CASCADE,
  autor_id UUID, usuario_id UUID,
  contenido TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'general',
  imagen_url TEXT, likes INTEGER DEFAULT 0,
  comentarios JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.erp_publicaciones_muro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden leer muro"
  ON public.erp_publicaciones_muro FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar"
  ON public.erp_publicaciones_muro FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Propietario puede actualizar"
  ON public.erp_publicaciones_muro FOR UPDATE
  TO authenticated
  USING (auth.uid() = autor_id OR auth.uid() = usuario_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_publicaciones_muro;
```

---

## 6. Conclusión

| Aspecto | Estado | Acción Requerida |
|---------|--------|------------------|
| Tablas operacionales | ✅ 39/40 | Crear `erp_publicaciones_muro` |
| RLS activo | ✅ | Verificar políticas por tabla |
| Realtime | ⚠️ No verificado | Confirmar publicación |
| Auth Site URL | ⚠️ No verificado | Configurar en Dashboard |
| Migraciones al día | ⚠️ No verificado | Ejecutar `npx supabase db remote commit` |

**Recomendación:** Aplicar el SQL de `erp_publicaciones_muro` desde el SQL Editor de Supabase y confirmar configuraciones de Auth desde el Dashboard.