# 🧪 SMOKE TEST — Validación de Implementaciones

## Instrucciones Rápidas

Ejecuta estas pruebas en orden para validar que todo funciona:

---

## ✅ TEST 1: Validación de Stock (P1)

**Escenario:** Intenta crear un vale de salida sin stock suficiente.

1. Ve a **Bodega** → **Vales de Salida**
2. Crea un nuevo vale:
   - Selecciona un material (ej: "Acero")
   - Nota el stock actual (ej: 5 unidades)
   - Intenta agregar una cantidad > stock (ej: 10)
3. **Resultado esperado:** ❌ Error bloqueante: "Stock insuficiente: Acero (disponible: 5, requerido: 10)"
4. **Acción:** El vale NO debe crearse

---

## ✅ TEST 2: Cascada OC → Stock (P2)

**Escenario:** Una orden de compra recibida incrementa automáticamente el stock.

1. Ve a **Bodega** → **Órdenes de Compra**
2. Crea una nueva OC:
   - Material: "Concreto"
   - Cantidad: 50
   - Estado inicial: "pendiente"
3. Nota el stock actual de Concreto (ej: 10)
4. Marca la OC como **"aprobado"** o **"recibida"**
5. Ve a **Bodega** → **Materiales** y verifica Concreto
6. **Resultado esperado:** ✅ Stock de Concreto = 10 + 50 = 60

---

## ✅ TEST 3: AuthGuard por Rol (P4)

**Escenario:** Un usuario con rol "Bodeguero" no puede acceder a "Financiero".

1. Abre DevTools → Console
2. Escribe: `localStorage.getItem('wm_erp_data_user')` (si existe)
3. O edita directamente el rol en el localStorage (para testing)
4. Intenta cambiar la URL a: `/#/financiero`
5. **Resultado esperado:** ❌ Redirige automáticamente a Login
6. Luego intenta: `/#/bodega` (permitido para Bodeguero)
7. **Resultado esperado:** ✅ Se carga sin redirigir

---

## ✅ TEST 4: Renderización Selectiva (P3)

**Escenario:** Solo las pantallas permitidas aparecen en el sidebar según el rol.

1. Login como **Bodeguero** (si es posible en demo)
2. Verifica que el sidebar SOLO muestre:
   - Dashboard
   - Bodega
   - Ajustes
3. **No deberían aparecer:**
   - Financiero
   - RRHH
   - Comercial/Finanzas
4. **Resultado esperado:** ✅ Sidebar respeta ALLOWED[rol]

---

## ✅ TEST 5: Cascada Avance → Proyecto (CONFIRMACIÓN)

**Escenario:** Registrar un avance en un presupuesto actualiza automáticamente el proyecto.

1. Ve a **Proyectos** → Selecciona uno
2. Ve a **Presupuestos** → Abre presupuesto del proyecto
3. Registra un avance en un renglón (ej: 50%)
4. Vuelve a **Proyectos**
5. Verifica que el proyecto ahora tenga avanceFisico ≈ 50%
6. **Resultado esperado:** ✅ Proyecto.avanceFisico actualizado automáticamente

---

## 📋 Checklist de Validación

| Test | P# | Status | Notas |
|------|----|---------|----|
| Stock insuficiente bloquea | P1 | ☐ | Error debe ser bloqueante |
| OC recibida suma stock | P2 | ☐ | Stock incrementa 1x |
| User no auth → Login | P4 | ☐ | AuthGuard funciona |
| Rol no permitido → Login | P4 | ☐ | AuthGuard respeta permisos |
| Sidebar oculta vistas | P3 | ☐ | Solo ALLOWED[rol] visible |
| Avance cascada → Proyecto | - | ☐ | Ya implementado |
| Build sin errores | - | ☐ | `npm run build` |
| Tests pasan | - | ☐ | `npm run test` |

---

## 🚨 Si algo falla:

1. **Stock no valida:** Revisar línea 2067 en store.tsx
2. **OC no suma stock:** Revisar línea 1993 en store.tsx
3. **No redirige a Login:** Revisar línea 117 en AppLayout.tsx
4. **Sidebar muestra todo:** Revisar línea 128 en AppLayout.tsx

---

## ✅ Cuando todo pase:

1. Ejecutar: `npm run build`
2. Verificar 0 errores
3. Ejecutar: `npm run test`
4. Verificar 76/76 pasando
5. Listo para deploy

---

*Generado: 2026-06-06 16:45*
