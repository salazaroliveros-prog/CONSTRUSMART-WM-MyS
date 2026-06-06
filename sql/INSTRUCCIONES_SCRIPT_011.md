# ✅ SOLUCIÓN: CREAR TABLAS FALTANTES + ACTIVAR REALTIME

**Problema:** Las 10 tablas siguen en DEFAULT porque NO EXISTEN en la BD
**Solución:** Crear las 10 tablas + Activar Realtime en TODAS

---

## 🚀 PASOS (3 MINUTOS)

### PASO 1: Copiar script completo

```
Archivo: sql/011_crear_tablas_faltantes_y_activar_realtime.sql

Este script:
✅ Crea las 10 tablas faltantes
✅ Activa Realtime en las 32 tablas
✅ Verifica el resultado
```

### PASO 2: Ejecutar en Supabase

```
1. Abre: https://app.supabase.com/
2. Tu proyecto → SQL Editor
3. BORRA TODO lo anterior
4. Copia TODO el contenido de: sql/011_crear_tablas_faltantes_y_activar_realtime.sql
5. Pega en SQL Editor
6. Click [RUN]
7. Espera resultado ✅
```

**Resultado esperado:**
```
✅ Query executed successfully
   Execution time: 3.45s
```

---

### PASO 3: Esperar 2 minutos

```
Supabase sincroniza internamente
Mientras esperas:
→ Toma un café ☕
→ Abre tu IDE
```

---

### PASO 4: Recarga Dashboard (F5)

```
1. Recarga: https://app.supabase.com/
2. Database → Tables
3. Verifica que TODAS muestren: Realtime: 🟢 ENABLED
```

---

## ✅ RESULTADO FINAL

```
Tablas creadas: 10 nuevas ✅
Realtime activado: 32/32 ✅ (100%)

Tablas ahora en ✅ FULL:
  ├─ erp_cuentas_cobrar ✅
  ├─ erp_cuentas_pagar ✅
  ├─ erp_hitos ✅
  ├─ erp_incidentes ✅
  ├─ erp_liberaciones_partida ✅
  ├─ erp_muro ✅
  ├─ erp_no_conformidades ✅
  ├─ erp_ordenes_cambio ✅
  ├─ erp_pruebas_laboratorio ✅
  └─ erp_riesgos ✅
```

---

## 🚀 PRÓXIMO PASO: DEPLOY

Una vez confirmado que todas están en ✅ FULL:

```bash
npm run build           # ✅ Verificar 0 errores
npm run test            # ✅ Verificar 76/76 pasando
git add .
git commit -m "Deploy: Realtime 100% (32/32 tablas), app lista"
git push origin main    # ✅ Vercel auto-deploya
```

---

**ACCIÓN AHORA:** Ejecuta el script 011 en Supabase SQL Editor
