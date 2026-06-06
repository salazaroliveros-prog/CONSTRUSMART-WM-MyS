# ⚡ GUÍA SIMPLE: ACTIVAR REALTIME EN SUPABASE

**Tiempo:** 3 minutos  
**Riesgo:** Ninguno

---

## 🚀 3 PASOS SIMPLES

### PASO 1: Ejecutar script (2 min)

```
1. Abre: https://app.supabase.com/
2. Tu proyecto → SQL Editor
3. BORRA TODO lo que haya
4. Copia SOLO ESTO (las líneas ALTER TABLE):

╔═══════════════════════════════════════════════════════════╗
║ ALTER TABLE erp_proyectos REPLICA IDENTITY FULL;        ║
║ ALTER TABLE erp_movimientos REPLICA IDENTITY FULL;      ║
║ ALTER TABLE erp_empleados REPLICA IDENTITY FULL;        ║
║ ALTER TABLE erp_materiales REPLICA IDENTITY FULL;       ║
║ ALTER TABLE erp_ordenes_compra REPLICA IDENTITY FULL;   ║
║ ALTER TABLE erp_proveedores REPLICA IDENTITY FULL;      ║
║ ALTER TABLE erp_eventos_calendario REPLICA IDENTITY FULL;║
║ ALTER TABLE erp_bitacora REPLICA IDENTITY FULL;         ║
║ ALTER TABLE erp_presupuestos REPLICA IDENTITY FULL;     ║
║ ALTER TABLE erp_avances REPLICA IDENTITY FULL;          ║
║ ALTER TABLE erp_licitaciones REPLICA IDENTITY FULL;     ║
║ ALTER TABLE erp_renglones REPLICA IDENTITY FULL;        ║
║ ALTER TABLE erp_insumos REPLICA IDENTITY FULL;          ║
║ ALTER TABLE erp_sub_renglones REPLICA IDENTITY FULL;    ║
║ ALTER TABLE erp_seguimiento REPLICA IDENTITY FULL;      ║
║ ALTER TABLE erp_vales_salida REPLICA IDENTITY FULL;     ║
║ ALTER TABLE erp_insumos_base REPLICA IDENTITY FULL;     ║
║ ALTER TABLE erp_rendimientos_cuadrilla REPLICA IDENTITY FULL;║
║ ALTER TABLE activos_herramientas REPLICA IDENTITY FULL; ║
║ ALTER TABLE cuadro_comparativo_proveedores REPLICA IDENTITY FULL;║
║ ALTER TABLE cotizaciones REPLICA IDENTITY FULL;         ║
║ ALTER TABLE anticipos REPLICA IDENTITY FULL;            ║
║ ALTER TABLE amortizaciones REPLICA IDENTITY FULL;       ║
║ ALTER TABLE pagos_proveedores REPLICA IDENTITY FULL;    ║
║ ALTER TABLE ventas_paquetes REPLICA IDENTITY FULL;      ║
║ ALTER TABLE centros_costo REPLICA IDENTITY FULL;        ║
║ ALTER TABLE cajas_chicas REPLICA IDENTITY FULL;         ║
║ ALTER TABLE destajos REPLICA IDENTITY FULL;             ║
║ ALTER TABLE logs_sistema REPLICA IDENTITY FULL;         ║
║ ALTER TABLE erp_auditoria REPLICA IDENTITY FULL;        ║
║ ALTER TABLE profiles REPLICA IDENTITY FULL;             ║
╚═══════════════════════════════════════════════════════════╝

5. Pega en SQL Editor (Ctrl+V)
6. Click [RUN] o Ctrl+Enter
7. Espera resultado ✅
```

**Resultado esperado:**
```
✅ Query executed successfully
   Execution time: 2.34s
```

---

### PASO 2: Esperar 1-2 minutos

```
La BD ya lo tiene habilitado, pero el Dashboard 
tarda un poco en actualizarse.

Mientras esperas:
→ Tómate un café ☕
→ Abre DevTools (F12) en la app
```

---

### PASO 3: Verificar en Dashboard

```
1. Recarga Supabase Dashboard (F5 en el navegador)
2. Ir a: Database → Tables
3. Haz click en cualquier tabla (ej: erp_proyectos)
4. Mira arriba donde dice:

   Realtime: 🟢 ENABLED  ✅
   
   (Si está en ROJO = DISABLED, espera otro minuto)
```

---

## ✅ CONFIRMACIÓN VISUAL

```
Supabase Dashboard
│
├─ Database
│  └─ Tables
│     └─ erp_proyectos
│        │
│        ├─ 🟢 Realtime: ENABLED ✅
│        ├─ Columns: id, nombre, cliente...
│        └─ Rows: 12
│
├─ erp_presupuestos
│  └─ 🟢 Realtime: ENABLED ✅
│
├─ erp_movimientos
│  └─ 🟢 Realtime: ENABLED ✅
│
└─ ... (todas las demás tablas)
```

**Si ves 🟢 ENABLED en VERDE en todas → ✅ LISTO**

---

## 🎯 ¿FUNCIONA? VERIFICACIÓN RÁPIDA

```
Abre 2 navegadores con la app:

Navegador 1:
  → Abre: localhost:8080/proyectos
  → Crea un nuevo proyecto: "Test Realtime"

Navegador 2:
  → Abre: localhost:8080/proyectos
  → ¿Ves el nuevo proyecto aparecer automáticamente?
  
  ✅ SÍ → Realtime FUNCIONA
  ❌ NO → Espera otro minuto + F5
```

---

## ❌ SI ALGO FALLA

### Error: "column replicaidentity does not exist"
```
❌ Esto ocurre si copias la consulta de verificación

✅ Solución: 
   NO copies las consultas de verificación
   Solo copia las líneas ALTER TABLE
```

### Ves DISABLED en rojo
```
❌ Realtime no activó

✅ Solución:
   1. Recarga Dashboard (F5)
   2. Espera 2 minutos más
   3. Si persiste, ejecuta el script nuevamente
```

### No ves cambios en tiempo real
```
❌ No sincroniza

✅ Soluciones en orden:
   1. F5 en ambos navegadores
   2. Recarga la app (Ctrl+Shift+R hard refresh)
   3. Abre DevTools → Console
   4. Revisa que no haya errores rojos
```

---

## 📋 CHECKLIST FINAL

```
☑️ Ejecuté las líneas ALTER TABLE
☑️ Espéré 1-2 minutos
☑️ Recargué Dashboard (F5)
☑️ Fui a Database → Tables
☑️ Vi "Realtime: 🟢 ENABLED" en 2-3 tablas
☑️ Probé con 2 navegadores
☑️ ¡Realtime está ACTIVO! ✅
```

---

## 🚀 SIGUIENTE PASO

Una vez confirmado Realtime:

```bash
npm run build    # Verificar 0 errores
npm run test     # Verificar 76/76 pasando
git push         # Deploy automático
```

---

*Guía simplificada: 2026-06-07*
