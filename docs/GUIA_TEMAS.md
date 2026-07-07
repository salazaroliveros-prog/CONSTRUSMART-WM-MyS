# CONSTRUSMART ERP — Guía de Personalización Visual

## Introducción

El ERP incluye un sistema avanzado de personalización visual que permite adaptar la interfaz a tus preferencias sin necesidad de recargar la página. Todos los cambios se aplican en tiempo real y se sincronizan automáticamente con Ajustes.

---

## Temas Visuales

Dispones de **5 temas profesionales**:

| Tema | Descripción | Uso recomendado |
|------|-------------|-----------------|
| Ant Design | Estilo clásico profesional | Oficinas, entornos corporativos |
| Dark Pro | Modo oscuro premium | Trabajo nocturno, reduce fatiga visual |
| Material 3 | Diseño moderno Material | Equipos modernos, Android |
| Glassmorphism | Efecto vidrio moderno | Presentaciones, demostraciones |
| Neomorphism | Estilo suave y elevado | Diseño experimental |

Para cambiar de tema:
1. Ve a **Ajustes → Apariencia**
2. Selecciona el tema en la sección "Tema Visual"
3. El cambio se aplica instantáneamente en toda la aplicación

---

## Color Primario

Personaliza el color de marca principal:
- **Azul Default** — `#1677ff`
- **Naranja Construcción** — `#ff8c42`
- **Verde Éxito** — `#52c41a`
- **Rojo Destructivo** — `#f5222d`
- **Púrpura Material** — `#6750a4`
- **Cian Oscuro** — `#00d9ff`
- **Amarillo Warning** — `#faad14`
- **Azul Info** — `#1890ff`

---

## Tipografía

### Fuente Base
Opciones: System UI, Inter, Roboto, Open Sans, Poppins

### Tamaño de Texto
- **Pequeño** — Texto compacto para pantallas grandes
- **Mediano** — Tamaño estándar recomendado
- **Grande** — Mejor legibilidad en pantallas pequeñas

---

## Espaciado y Densidad

### Densidad de Tablas
Controla la altura de filas y celdas:
- **Compacta** — `8px` padding, filas delgadas
- **Normal** — `16px` padding, equilibrio estándar
- **Cómoda** — `24px` padding, máxima legibilidad

### Espaciado Global
Ajusta padding y gaps en toda la app:
- **Compacto** — `4px`
- **Normal** — `8px`
- **Amplio** — `16px`

### Radio de Bordes
Define las esquinas de cards, botones e inputs:
- **Ninguno** — `0px` (rectangular)
- **Pequeño** — `4px`
- **Mediano** — `6px`
- **Grande** — `12px`
- **Pill** — `9999px` (completamente redondeado)

---

## Sidebar

### Posición
- **Izquierda** — Layout clásico
- **Derecha** — Para pantallas ultrawide
- **Overlay** — Flotante sobre el contenido

### Modo
- **Expandido** — Sidebar completa siempre visible
- **Colapsado** — Solo iconos
- **Mini** — Iconos reducidos
- **Hover-expand** — Se expande al pasar el cursor

### Ancho
- **240px** — Estándar
- **280px** — Amplio
- **320px** — Extra amplio

---

## Animaciones

### Habilitar/Deshabilitar
Control global de transiciones suaves entre pantallas.

### Tipo de Animación
- **Fundido (fade)** — Transición suave con desplazamiento vertical
- **Deslizar (slide)** — Entrada desde la derecha
- **Escalar (scale)** — Zoom-in suave
- **Ninguna** — Cambio instantáneo

---

## Elementos de Interfaz

### Migas de Pan (Breadcrumbs)
Navegación jerárquica en la parte superior del contenido. Muestra la ruta actual: `ERP / Proyectos`.

### Pie de Página (Footer)
Muestra información de la empresa, año y eslogan en la parte inferior.

### Modo Táctil
Optimiza targets táctiles para tablets:
- Botones mínimos de `48x48px`
- Inputs con altura mínima de `48px`
- Desactiva efectos hover en cards

---

## Atajos y Recomendaciones

| Situación | Configuración recomendada |
|-----------|---------------------------|
| Trabajo nocturno | Dark Pro + animaciones fade |
| Presentaciones | Glassmorphism + animaciones scale |
| Tablets | Modo táctil ON + densidad cómoda + fuente grande |
| Pantallas ultrawide | Sidebar derecha + ancho 280px |
| Accesibilidad | Fuente Inter grande + densidad cómoda + alto contraste |

---

## Sincronización

Todos los ajustes se guardan automáticamente en `localStorage` bajo la clave `wm_erp_data_settings`. Si necesitas transferir tu configuración a otro dispositivo:

1. Ve a **Ajustes → Datos**
2. Exporta la configuración como JSON
3. En el otro dispositivo, importa el archivo

Los cambios también se sincronizan con Supabase cuando hay conexión a internet.