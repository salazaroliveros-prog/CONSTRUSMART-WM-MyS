# 🗺️ Roadmap de Desarrollo: ERP Integral Constructora WM
> **Instrucciones para el Agente de IA:** Sigue este checklist secuencialmente. Cada módulo cuenta con sus reglas de negocio y validaciones técnicas. Marca con `[x]` al completar y verificar el funcionamiento de cada feature.


BLOQUE 0: PANTALLAS DEL DASHBOARD (INTERFAZ VISUAL Y CONTROL)

### 0.1 Dashboard Gerencial / Ejecutivo (Vista Multi-Proyecto)
* [ ] **KPIs de Rendimiento Global:** Cuadros numéricos de alto impacto en la cabecera: *Margen de Utilidad Promedio, Total de Proyectos Activos, Presupuesto Total en Ejecución, Desviación Global de Costos*.
* [ ] **Gráfica de Curva S Consolidada:** Gráfico de líneas interactivas que compare el Avance Programado vs. Avance Real de todas las obras activas.
* [ ] **Mapa de Calor de Proyectos (Geolocalización):** Integración con mapas (ej. Google Maps / Mapbox) mostrando pines interactivos de las obras con colores de alerta (*Verde: En tiempo/costo, Amarillo: Riesgo, Rojo: Desviado*).
* [ ] **Tabla de Estado de Licitaciones:** Widget que muestre las últimas propuestas comerciales y su estado actual en el pipeline Kanban.

### 0.2 Dashboard de Control de Proyecto Individual (Vista del Residente)
* [ ] **Métricas del Valor Ganado (EVM):** Gráficos visuales de velocímetro o barras para los indicadores `$CV$` (Variación de Costo) y `$SV$` (Variación de Tiempo).
* [ ] **Widget de Avance Físico vs. Financiero:** Gráfica de barras comparativa que demuestre si el dinero cobrado/gastado corresponde al volumen físico construido en campo.
* [ ] **Feed de Bitácora y Fotos Recientes:** Panel lateral dinámico con las últimas fotos subidas desde el campo y las observaciones climatológicas o de retraso del día.
* [ ] **Alerta de Renglones Críticos:** Lista ordenada de las 5 partidas o renglones que están presentando las mayores pérdidas financieras o retrasos en rendimiento.

### 0.3 Dashboard de Compras, Logística e Inventarios
* [ ] **Gráfica de Pareto (Regla 80/20) de Materiales:** Gráfico de barras/pastel interactivo que identifique de forma inmediata el 20% de los insumos que absorben el 80% del presupuesto de la empresa.
* [ ] **Panel de Órdenes de Compra por Aprobar:** Lista restrictiva con acciones rápidas (`Aprobar / Rechazar / Modificar`) para compras que exceden el presupuesto.
* [ ] **Widget de Alertas de Stock de Bodega:** Tabla reactiva con barras de progreso que se tornen rojas cuando materiales críticos (acero, cemento) bajen de su stock mínimo de seguridad.

### 0.4 Dashboard Financiero y Control de Caja
* [ ] **Gráfica de Flujo de Caja Proyectado (Cash Flow):** Gráfico de áreas o líneas que cruce los ingresos esperados (cobro de estimaciones) contra los egresos programados (pagos a proveedores/planillas) a 30, 60 y 90 días.
* [ ] **Widget de Cajas Chicas por Validar:** Panel de flujo para revisión rápida de las facturas enviadas por los ingenieros desde las obras, mostrando la foto del documento de soporte.
* [ ] **Resumen de Utilidad Neta por Centro de Costo:** Tabla comparativa donde cada proyecto muestra sus ingresos totales, egresos reales y el margen de ganancia real al momento.

---

## 🏗️ BLOQUE 1: INGENIERÍA Y CONTROL DE PROYECTOS (EL NÚCLEO)

### 1.1 Módulo de Presupuestos y APUs (Motor de Cálculo)
* [ ] **Desglose Matricial de APU:** Implementar la separación relacional en base de datos para clasificar insumos en: *Materiales, Mano de Obra, Equipo y Subcontratos*.
* [ ] **Cálculo Automático de FSR (Factor de Salario Real):** Crear función que tome el salario base de la mano de obra y le aplique el porcentaje de prestaciones de ley local de forma automática.
* [ ] **Rendimientos Inversos:** Programar la fórmula `Costo_Unitario = Costo_Insumo / Rendimiento_Diario` para cálculo automático de renglones.
* [ ] **Porcentaje de Herramienta Menor:** Inyectar automáticamente entre un 3% y 5% (configurable) al costo total de la mano de obra dentro de cada APU.
* [ ] **Motor de Recálculo en Cascada (Precios Dinámicos):** * *Regla:* Al actualizar el precio de un insumo en el catálogo global, disparar un trigger o función que recalcule todos los APUs del proyecto en segundo plano.

### 1.2 Módulo de Planificación (Cronograma Dinámico)
* [ ] **Generación de Duración por Rendimiento:** Calcular la duración estimada del renglón mediante: `Duración = Cantidad_Obra / Rendimiento_Cuadrilla`.
* [ ] **Diagrama de Gantt Interactivo (Reactivo):** Crear la interfaz visual del cronograma. Al arrastrar o modificar la barra de tiempo, se debe actualizar la fecha de inicio/fin en la tabla `presupuesto_renglones`.
* [ ] **Vínculo Cantidad-Tiempo:** Si se modifica la cantidad presupuestada de un renglón, recalcular la duración del Gantt al milisegundo de forma automática.

### 1.3 Módulo de Control de Campo y Bitácora Digital
* [ ] **Reporte Diario Móvil (UI PWA/Responsiva):** Vista optimizada para el ingeniero residente que capture: clima, personal activo, maquinaria y tareas ejecutadas.
* [ ] **Módulo de Destajos / Rendimiento Real:** Capturar el avance físico diario por cuadrilla para contrastarlo contra el rendimiento teórico planteado en el APU.
* [ ] **Carga de Evidencia Fotográfica:** Implementar storage (ej. Supabase Storage o AWS S3) para subir fotos de avances asociadas directamente a un renglón presupuestario.

### 1.4 datos a tomar en cuenta para la compiacion del motor de calculo.
* [] **eres un arquitecto y tienes proyectos en ejecución y clientes potenciales se necesita de una herramienta de gestion de clientes (para registro de datos de clientes) una calculadora exacta de materiales, mano de obra, tiempo de ejecución, que integre un motor de calculo avanzado de costos directos e indirectos, costos administrativos, e imprevistos APU's completas en el area de Guatemala, que integre la exportación de dichas cuantificaciones entregando resumen de reglones así como desglose unitario de materiales con precios actuales con la opción de ser modificados por el usuario, dichas exportaciones tipo informe formal y profesional tipo tabla ya con membrete de la empresa "CONSTRUCTORA WM/M&S" eslogan Edificando el Futuro,  en pdf y csv, que la interfaz de calculo por defecto incluya una gama alta de renglones integrados en filtro de selección mínimo de 40 renglones en orden cronológico y otro filtro de selección de tipología "residencial, comercial, industrial, civil y publica" cada una de las tipologías con sus 40 renglones respectivos en orden cronológico integrando ya sus factores de calculo de rendimientos y costos por defecto también pudiendo ser modificados por el usuario que en base a ir añadiendo renglones de filtro se vaya expendiendo tipo collapsable el formato de renglones del presupuesto y que se pueda guardar y exportar en pdf y csv. 

agregale una siguiente pantalla que sera de seguimiento a los proyectos integrando graficas de avance físico financiero, graficas de ingresos y gastos, graficas tipo tabla con nombres de los proyectos en ejecución y parte los proyectos que solo quedan en planeación en esa tabla siguiendo a la par de cada proyecto que tenga cada una barra de avance físico y financiero, después una columna de ingresos otra columna de gastos  y la otra columna de pendiente de aportar, después agregas otra pantalla de control de pago de planilla o mano de obra y gastos administrativos incluyendo gastos personales para manejar el control de los gastos operativos de la empresa y los gastos personales, puedes incluir graficas en esta pantalla, luego esta pantalla sera la primera que se muestre al ingresar a la aplicación que sera una pantalla de tablero principal que solo integrara el encabezado del usuario con su avatar nombre de la empresa reloj funcional y un calendarios este calendario que sea interactivo y de programación de actividades, luego una serio de filtros de selección "proyectos" campo de texto para ingreso de datos como "ingreso y gastos" que incluya un pequeño formato tipo formulario para agregar "descripción, cantidad, unidad, filtro de categoría "materiales, mano de obra, herramienta, sub-contrato, administrativo, personal, transporte, fijos, hogar, aporte, trabajos extra", costo unit. costo total y fecha.  esta información sera mostrada en la pantalla de seguimiento y la pantalla de gastos operativos, administrativos y personales, luego este tablero que incluya una serie de graficas interactivas estilo KPI's y POWER BI interactivas en una sola pantalla sin scroll mostrando las métricas y datos mas importantes de los proyectos en ejecución, integra en este pantalla el botón que dirige hacia cada pantalla con efectos  de transición suaves, y cada pantalla que integre botón de inicio y dirige al tablero principal y el tablajero el botón de salir para salir y dirija al login. esta aplicación que sea responsiva tanto para pc como para teléfonos móviles.


MODULOS PARA INTEGRARLOS COMPLETOS.

-dashboard.
-proyectos ( portafolio de proyectos)
-presupuestos ( calculadora )
-seguimiento y control ( bitácora y avances )
-financiero ( ingreso y gastos. todo el control financiero)
-RRHH ( control de personal y pago de planillas)
-bodega ( control de stock, ordenes de compra y proveedores)
-módulos extra según tu Análisis del ERP completo

---

## 🛒 BLOQUE 2: CADENA DE SUMINISTRO Y LOGÍSTICA

### 2.1 Módulo de Gestión de Compras
* [ ] **Vinculación con la Explosión de Materiales:** Bloquear o emitir alertas si una Solicitud de Compra excede la cantidad absoluta permitida por la explosión de materiales del proyecto.
* [ ] **Cuadro Comparativo de Proveedores:** Interfaz para ingresar cotizaciones de múltiples proveedores y resaltar automáticamente la opción más económica y veloz.
* [ ] **Flujo de Aprobación de Órdenes de Compra (OC):** Sistema de estados (`Borrador -> Pendiente de Aprobación -> Aprobado -> Emitido`). Solo usuarios con rol 'Gerente' pueden aprobar OCs por encima de un monto límite.

### 2.2 Módulo de Inventarios y Bodegas
* [ ] **Entradas de Almacén vs OC:** Validar físicamente que lo ingresado a bodega coincida en cantidad y especificación con la Orden de Compra original.
* [ ] **Vales de Salida Destinados a Renglón:** Cada insumo que sale de la bodega de la obra debe ir imputado a un código de renglón específico para calcular el porcentaje de desperdicio real.
* [ ] **Alertas de Stock Mínimo:** Configurar notificaciones del sistema cuando los materiales críticos (cemento, hierro) bajen del umbral mínimo de seguridad.
* [ ] **Control de Activos y Herramientas:** Registro de asignación para saber exactamente qué operador o cuadrilla tiene bajo su resguardo un equipo propiedad de la empresa.

---

## 💼 BLOQUE 3: ADMINISTRACIÓN, FINANZAS Y COMERCIAL

### 3.1 Módulo Comercial y CRM Inmobiliario
* [ ] **Pipeline de Licitaciones:** Tablero tipo Kanban para el seguimiento de propuestas comerciales (`Identificado -> En Estudio -> Presentado -> Ganado / Perdido`).
* [ ] **Control de Ventas y Paquetes (Si aplica desarrollo propio):** Módulo para gestionar la preventa de unidades, reservaciones, planes de pago de enganches y saldos pendientes.

### 3.2 Módulo de Tesorería y Flujo de Caja
* [ ] **Gestión y Amortización de Anticipos:** Automatizar el descuento proporcional del anticipo del cliente en cada una de las estimaciones/valuaciones de obra presentadas.
* [ ] **Cajas Chicas de Obra:** Permitir al residente cargar facturas/recibos desde el campo mediante fotografía y enviarlos a revisión contable centralizada.
* [ ] **Programación de Pagos a Proveedores:** Vista financiera consolidada para autorizar egresos basados en fechas de vencimiento de facturas y disponibilidad de flujo.

### 3.3 Módulo de Contabilidad, Impuestos y Planillas
* [ ] **Estructura por Centros de Costo:** Configurar la base de datos para que cada proyecto funcione como un centro de costo aislado. Toda compra, planilla o gasto debe asociarse obligatoriamente a un proyecto.
* [ ] **Planilla de Destajos (Mano de Obra de Campo):** Motor de cálculo que procese los pagos semanales de los albañiles/contratistas basados en el volumen de obra realmente ejecutado y verificado en campo.
* [ ] **Automatización de Impuestos:** Cálculo automático de retenciones de ISR e IVA correspondientes a subcontratos y facturas de proveedores.

---

## 📊 BLOQUE 4: INTELIGENCIA DE NEGOCIOS Y SEGURIDAD

### 4.1 Módulo de Inteligencia de Negocios (BI)
* [ ] **Cálculo de Métricas del Valor Ganado (EVM):** Implementar las fórmulas en el backend para retornar al dashboard:
  * Variación de Costo: `CV = EV - AC`
  * Variación de Tiempo: `SV = EV - PV`
* [ ] **Dashboard de Curva S:** Generar gráfica interactiva que dibuje la línea del avance planificado vs el avance real financiero y físico.
* [ ] **Diagrama de Pareto de Insumos (Regla 80/20):** Vista gráfica que resalte el 20% de los materiales que representan el 80% del costo total del proyecto para enfoque prioritario del departamento de compras.

### 4.2 Módulo de Seguridad y Auditoría (RBAC)
* [ ] **Control de Acceso Basado en Roles (RBAC):** Definir middlewares de rutas y endpoints bloqueados según los roles establecidos (`Administrador, Gerente, Residente, Compras, Bodeguero`).
* [ ] **Logs de Auditoría Imborrables:** Crear una tabla `logs_sistema` que registre de forma obligatoria: `usuario_id`, `accion`, `tabla_afectada`, `valores_anteriores`, `valores_nuevos` y `timestamp`.