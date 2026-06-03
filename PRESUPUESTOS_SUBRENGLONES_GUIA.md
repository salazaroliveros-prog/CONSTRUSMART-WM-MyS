# 📊 Guía: Sub-Renglones en el Módulo de Presupuestos

## ✨ Novedades Implementadas

Se ha mejorado significativamente el módulo de **Presupuestos** con la capacidad de desglosar materiales en **sub-renglones**. Esto permite un control más detallado de los materiales necesarios para cada renglon.

---

## 🎯 ¿Qué son los Sub-Renglones?

Los **sub-renglones** son un desglose detallado de los materiales específicos que se necesitan para cada renglon del presupuesto. Permiten:

✅ Especificar exactamente qué materiales se usan (cemento, acero, ladrillo, etc.)  
✅ Definir la cantidad unitaria de material por unidad de obra  
✅ Calcular automáticamente la cantidad total según la cantidad del renglon  
✅ Mantener un control de costos más preciso  
✅ Generar reportes detallados de materiales  

---

## 🔧 Cómo Usar

### 1️⃣ Agregar un Renglon

```
Pasos:
1. Selecciona el renglon del dropdown "Agregar renglón"
2. O haz clic en "Todos" para agregar todos los renglones disponibles
3. Los renglones se agregan COLAPSADOS por defecto
```

### 2️⃣ Expandir el Renglon

```
Haz clic en el icono ▶ (chevron) al lado del código del renglon
para expandir y ver las opciones de edición
```

### 3️⃣ Agregar Sub-Renglones (Materiales)

Una vez el renglon está expandido:

```
1. Ve a la sección "📦 Desglose de Materiales por Renglon"
2. Haz clic en el botón "+ Material"
3. Se agregará una nueva fila editable
```

### 4️⃣ Editar Sub-Renglon

En cada fila de sub-renglon, puedes editar:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Material** | Nombre del material | Cemento gris |
| **Cant/u** | Cantidad por unidad de obra | 0.35 (0.35 bolsas por m³) |
| **Unidad** | Unidad de medida | kg, l, m², u, etc. |
| **Precio** | Precio unitario del material | 85.50 (Q/unidad) |

**Ejemplo práctico:**
- Material: `Cemento gris`
- Cant/u: `0.35` (bolsas por m³ de concreto)
- Unidad: `bolsa`
- Precio: `85.50` (Q por bolsa)
- Si el renglon tiene cantidad = 3 m³
- Total = 0.35 × 3 × 85.50 = **Q 898.25**

### 5️⃣ Eliminar un Sub-Renglon

Haz clic en la **X** roja al final de la fila.

---

## 📊 Resumen Automático de Materiales

Debajo de todos los renglones, la app genera automáticamente un **resumen consolidado**:

```
📊 Resumen de Materiales a Utilizar
┌─────────────────────────────────────┐
│ Cemento gris           │ 25.50 bolsas │ Q 2,180.75 │
│ Acero de refuerzo Fy40 │ 1,250.00 kg  │ Q 12,500  │
│ Arena de río           │ 85.00 m³     │ Q 8,925   │
│ Bloque de concreto     │ 8,500.00 u   │ Q 34,000  │
└─────────────────────────────────────┘
```

El resumen muestra:
- ✅ Nombre del material (agrupado y consolidado)
- ✅ Cantidad total a utilizar (sumada de todos los renglones)
- ✅ Unidad de medida
- ✅ Costo total del material

---

## 📁 Exportación a PDF y CSV

### 📄 PDF Export

El PDF ahora incluye **3 secciones principales**:

1. **Resumen de Renglones** (como siempre)
   - Tabla con todos los renglones y sus totales
   
2. **Resumen de Materiales a Utilizar** (NUEVO)
   - Tabla consolidada de todos los materiales
   - Cantidad total por material
   - Subtotal por material
   - Total general de materiales

3. **Desglose Unitario de Materiales (APU)**
   - APU tradicional de costos
   - Incluyendo el desglose de sub-renglones para cada renglon (NUEVO)

**Ejemplo de estructura PDF:**
```
┌─ Presupuesto de Obra
│  ├─ Resumen de Renglones
│  │  └─ [Tabla de renglones]
│  ├─ Resumen de Materiales a Utilizar (NUEVO)
│  │  └─ [Tabla consolidada de materiales]
│  ├─ Desglose Unitario de Materiales (APU)
│  │  ├─ RES-001: Limpieza y chapeo
│  │  │  ├─ Insumos...
│  │  │  └─ Desglose de Materiales: [sub-renglones]
│  │  ├─ RES-002: Trazo...
│  │  └─ ...
│  └─ Pie de página
└─ Fin
```

### 📊 CSV Export

El CSV incluye:
1. Encabezado con datos del proyecto
2. Tabla de renglones (como siempre)
3. Sección `=== RESUMEN DE MATERIALES ===` (NUEVO)
   - Material
   - Cantidad
   - Unidad
   - Subtotal

---

## 💡 Casos de Uso

### Caso 1: Presupuesto de Concreto

```
Renglon: Cimientos de concreto (5 m³)

Sub-renglones:
1. Cemento gris
   - Cant/u: 0.35 bolsas/m³
   - Unidad: bolsa
   - Precio: Q85.50/bolsa
   - Total: 0.35 × 5 × 85.50 = Q 1,496.25

2. Arena de río
   - Cant/u: 0.6 m³/m³
   - Unidad: m³
   - Precio: Q105/m³
   - Total: 0.6 × 5 × 105 = Q 3,150

3. Grava #20
   - Cant/u: 0.8 m³/m³
   - Unidad: m³
   - Precio: Q120/m³
   - Total: 0.8 × 5 × 120 = Q 4,800

4. Acero de refuerzo Fy40
   - Cant/u: 45 kg/m³
   - Unidad: kg
   - Precio: Q10/kg
   - Total: 45 × 5 × 10 = Q 2,250

Total de Materiales para este renglon: Q 11,696.25
```

### Caso 2: Levantado de Muro

```
Renglon: Levantado de muro block 0.15 (150 m²)

Sub-renglones:
1. Bloque de concreto 15cm
   - Cant/u: 57 bloques/m²
   - Unidad: u
   - Precio: Q4/bloque
   - Total: 57 × 150 × 4 = Q 34,200

2. Mortero (arena + cemento)
   - Cant/u: 0.015 m³/m²
   - Unidad: m³
   - Precio: Q350/m³
   - Total: 0.015 × 150 × 350 = Q 787.50

Total de Materiales: Q 34,987.50
```

---

## ⚙️ Características Técnicas

### Cálculos Automáticos

Para cada sub-renglon:
```
Total = cantidadUnitaria × cantidadRenglon × precioUnitario
```

### Consolidación de Materiales

Cuando generas el resumen:
```
Para cada material (agrupado por nombre + unidad):
  Cantidad Total = SUM(cantidadUnitaria × cantidadRenglon para cada renglon)
  Costo Total = SUM(cantidadUnitaria × cantidadRenglon × precioUnitario)
```

### Persistencia

- Los sub-renglones se guardan automáticamente en `localStorage`
- Se guardan cuando haces clic en "Guardar"
- Se incluyen en las exportaciones PDF y CSV

---

## 🎨 Interfaz Visual

### Vista Colapsada
```
▶ RES-001 | Limpieza y chapeo de terreno | 50 m² | Q 5,000.00 | 🗑️
```

### Vista Expandida
```
▼ RES-001 | Limpieza y chapeo de terreno | 50 m² | Q 5,000.00 | 🗑️
├─ Cantidad: 50 m²
├─ Rendimiento/día: 200
├─ Costos: Materiales, Mano Obra, Equipo
│
├─ 📦 Desglose de Materiales por Renglon [+ Material]
│  ├─ Herbicida potente    │ 0.5 l/m² │ l   │ 285   │ Q 7,125
│  ├─ Servicio personal    │ 1.0 j/m² │ j   │ 250   │ Q 12,500
│  └─ [X]
│
└─ Desglose APU (insumos)
   ├─ Limpieza manual...
   └─ ...
```

---

## 📌 Tips y Recomendaciones

✅ **Aprovecha la consolidación:** Los materiales se agrupan automáticamente, así que no te preocupes por escribir exactamente igual.

✅ **Actualiza presupuestos:** Si cambias la cantidad de un renglon, el resumen se recalcula automáticamente.

✅ **Guarda regularmente:** Usa el botón "Guardar" para guardar tu trabajo en localStorage.

✅ **Exporta documentos:** Los clientes verán un resumen profesional de materiales en el PDF.

✅ **Usa unidades estándar:** 
   - kg, l, m², m³ para cantidades grandes
   - u (unidad) para conteos individuales
   - ml para líquidos

---

## 🐛 Troubleshooting

### P: ¿Por qué los renglones se abren colapsados?
**R:** Es intencionado. Se abren colapsados para que la interfaz sea más limpia. Expande el que necesites editar.

### P: ¿Puedo editar múltiples sub-renglones a la vez?
**R:** No, edita uno a la vez. Haz cambios y el cálculo se actualiza automáticamente.

### P: ¿Se pierden los datos si cierro el navegador?
**R:** No si hiciste clic en "Guardar". Se guardan en localStorage. Si no guardaste, desaparecen.

### P: ¿El resumen incluye todos los renglones?
**R:** Sí, el resumen automático consolida TODOS los sub-renglones de TODOS los renglones.

---

## ✅ Mejoras Implementadas

- [x] **Catálogo de materiales predefinidos:** Implementado en migración v1.2.0 — tabla `erp_insumos_base` con 24 insumos (materiales, MO, equipo) precargados con precios de referencia, rubro y categoría.
- [x] **Validaciones de precios:** Implementado en `Administracion.tsx` (tab Validación Precios) y `useNuevosModulos.ts` — alertas si precio = 0, negativo o > Q10,000.
- [x] **Plantillas de sub-renglones por tipo de renglón:** Implementado en `RendimientoCampo.tsx` (tab Plantillas) — 4 plantillas predefinidas (Concreto cimientos, Acero refuerzo, Muro block, Encofrado losa) con carga con un clic.
- [x] **Historial de cambios en presupuestos:** ✅ Implementado (versiones + CRUD en Supabase)
- [x] **Comparativa de presupuestos:** ✅ Implementado (múltiples versiones visibles en `PresupuestosList`)

---

## 📞 Soporte

Cualquier duda o sugerencia, consulta con el equipo de desarrollo.

**Funcionalidades implementadas:**
✅ Sub-renglones editables
✅ Cálculo automático de cantidades
✅ Resumen consolidado de materiales
✅ Exportación a PDF con detalles
✅ Exportación a CSV con materiales
✅ Colapso por defecto de renglones

¡Disfruta el nuevo módulo de presupuestos! 🎉
