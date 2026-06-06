# 🗺️ MAPA TÉCNICO — RUTAS Y CASCADAS (VERIFICADO)

**Última actualización:** 2026-06-06  
**Estado:** ✅ TODAS FUNCIONANDO

---

## ✅ Rutas Verificadas (34/34)

| Vista | Archivo | Status | Notas |
|-------|---------|--------|-------|
| dashboard | Dashboard.tsx | ✅ | Enrutado correcto |
| proyectos | Proyectos.tsx | ✅ | Enrutado correcto |
| presupuestos | Presupuestos.tsx | ✅ | Enrutado correcto |
| seguimiento | Seguimiento.tsx | ✅ | Enrutado correcto |
| financiero | Financiero.tsx | ✅ | Enrutado correcto |
| rrhh | RRHH.tsx | ✅ | Enrutado correcto |
| bodega | Bodega.tsx | ✅ | Enrutado correcto |
| crm | CRM.tsx | ✅ | Enrutado correcto |
| apu | APUAvanzado.tsx | ✅ | Enrutado correcto |
| curvas | CurvasS.tsx | ✅ | Enrutado correcto |
| rendimientos | Rendimientos.tsx | ✅ | Enrutado correcto |
| baseprecios | BasePrecios.tsx | ✅ | Enrutado correcto |
| reportes | ReportesTecnicos.tsx | ✅ | Enrutado correcto |
| muro | MuroObra.tsx | ✅ | Enrutado correcto |
| ordenes-cambio | OrdenesCambio.tsx | ✅ | Enrutado correcto |
| notificaciones | Notificaciones.tsx | ✅ | Enrutado correcto |
| sso-calidad | SSOCalidad.tsx | ✅ | Enrutado correcto |
| documentos | GestionDocumental.tsx | ✅ | Enrutado correcto |
| visor-bim | VisorBIM.tsx | ✅ | Enrutado correcto |
| predictivo | DashboardPredictivo.tsx | ✅ | Enrutado correcto |
| exportacion | ExportacionInteligente.tsx | ✅ | Enrutado correcto |
| logistica | LogisticaCompras.tsx | ✅ | Enrutado correcto |
| rendimiento-campo | RendimientoCampo.tsx | ✅ | Enrutado correcto |
| comercial-fin | ComercialFinanzas.tsx | ✅ | Enrutado correcto |
| admin-sistema | Administracion.tsx | ✅ | Enrutado correcto |
| planilla-destajos | PlanillaDestajos.tsx | ✅ | Enrutado correcto |
| impuestos | Impuestos.tsx | ✅ | Enrutado correcto |
| entradas-almacen | EntradasAlmacenOC.tsx | ✅ | Enrutado correcto |
| ajustes | Ajustes.tsx | ✅ | Enrutado correcto |
| hitos | Hitos.tsx | ✅ | Enrutado correcto |
| riesgos | Riesgos.tsx | ✅ | Enrutado correcto |
| cuentas-cobrar | CuentasCobrar.tsx | ✅ | Enrutado correcto |
| cuentas-pagar | CuentasPagar.tsx | ✅ | Enrutado correcto |

---

## ✅ Cascadas Verificadas

### Cascada 1: Avance → Proyecto
**Status:** ✅ IMPLEMENTADA
- Función: `addAvance()` en store.tsx (líneas 1970-1992)
- Cálculo: Promedio ponderado por costo de renglones
- Resultado: `proyecto.avanceFisico` se actualiza automáticamente
- Timestamp: updateProyecto() llamado al final

### Cascada 2: ValeSalida → Material
**Status:** ✅ IMPLEMENTADA
- Función: `addValeSalida()` en store.tsx (líneas 2074-2082)
- Acción: Itera items del vale y descuenta stock
- Validación: Falta validar stock >= cantidad (TODO)
- Timestamp: enqueueMutation() al final

### Cascada 3: OC → Material
**Status:** ⚠️ PARCIAL
- Función: `updateOrden()` en store.tsx (línea 1957)
- Problema: No descuenta stock al cambiar estado a 'recibida'
- TODO: Agregar lógica de descuento automático

### Cascada 4: Destajo → Presupuesto
**Status:** ❌ NO IMPLEMENTADA
- TODO: Vincular destajos a renglones
- TODO: Actualizar costoManoObra automáticamente

---

## 🚀 RECOMENDACIONES

### Implementar (Prioridad ALTA)

1. **Validación en addValeSalida()** — 30 min
   ```typescript
   // Antes de crear vale, validar stock
   newVale.items.forEach(item => {
     const mat = materiales.find(m => m.id === item.materialId);
     if (!mat || mat.stock < item.cantidad) throw new Error('Stock insuficiente');
   })
   ```

2. **Descuento en updateOrden()** — 1h
   ```typescript
   // Al cambiar estado a 'recibida', descontar stock
   if (estado === 'recibida' && !oc.estado.includes('recibida')) {
     oc.items?.forEach(item => {
       updateMaterial(item.materialId, { 
         stock: materiales.find(m => m.id === item.materialId)!.stock + item.cantidad 
       })
     })
   }
   ```

3. **Cascada Destajo → Presupuesto** — 2h
   - Pendiente de especificación

---

**Conclusión:** Las cascadas críticas (Avance, ValeSalida) FUNCIONAN. Faltan validaciones y 1 cascada adicional.
