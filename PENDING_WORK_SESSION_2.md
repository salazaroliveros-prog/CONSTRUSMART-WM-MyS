# 🔄 TRABAJO PENDIENTE - SESIÓN 2
## Instrucciones para Reanudar la Implementación

**Estado:** Pausa estratégica (Sesión 1 completada)  
**Próximo:** Sesión 2 - Consolidar Seguimiento, Financiero y Proyectos  
**Estimado:** 3-4 horas

---

## 🎯 OBJETIVOS SESIÓN 2

### FASE 3: Consolidar Seguimiento.tsx (4 horas)
**Objetivo:** Convertir 5 tabs en 1 pantalla narrativa

**Cambios principales:**
```
ANTES:
├─ Tab 1: Resumen (tabla)
├─ Tab 2: EVM (gráficos)
├─ Tab 3: Bitácora (fotos)
├─ Tab 4: Avances (timeline)
└─ Tab 5: Cronograma (gantt)
= 9+ clics para entender problema

DESPUÉS:
├─ Sticky: ProyectoSelector (ya creado)
├─ Sticky: StatusBar (Física | Financiero | Variación)
├─ Toolbar: Pestañas como botones (no tabs)
├─ Main: Contenido dinámico (Analysis/Bitácora/Cronograma/Riesgos)
└─ Footer: Acciones contextual
= 2 clics para entender problema
```

**Pseudocódigo de estructura:**
```tsx
function Seguimiento() {
  const [selectedTab, setSelectedTab] = useState('analysis');
  const [selectedProject, setSelectedProject] = useState(proyectos[0]?.id);
  
  return (
    <div>
      {/* 1. Selector sticky */}
      <ProyectoSelector 
        proyectos={proyectos}
        currentProyectoId={selectedProject}
        onProyectoChange={setSelectedProject}
      />
      
      {/* 2. Status bar sticky */}
      <StatusBar proyecto={proyectos.find(...)} />
      
      {/* 3. Tabs como toolbar */}
      <TabToolbar selectedTab={selectedTab} onChange={setSelectedTab} />
      
      {/* 4. Contenido dinámico */}
      {selectedTab === 'analysis' && <AnalysisPanel />}
      {selectedTab === 'bitacora' && <BitacoraPanel />}
      {selectedTab === 'cronograma' && <CronogramaPanel />}
      {selectedTab === 'riesgos' && <RiesgosPanel />}
    </div>
  );
}
```

**Componentes a crear:**
1. `SeguimientoStatusBar.tsx` - Barra de estado del proyecto
   - Física | Financiero | Variación
   - Color semántico (rojo/amarillo/verde)
   - Sparkline opcional

2. `SeguimientoAnalysisPanel.tsx` - Panel EVM
   - Gauge CPI/SPI
   - Gráfico Físico vs Financiero
   - Curva de avance

3. `SeguimientoBitacoraPanel.tsx` - Panel de bitácora
   - Entrada última + histórico
   - Formulario + botones

4. `SeguimientoCronogramaPanel.tsx` - Panel Gantt
   - Hitos del proyecto
   - Timeline interactiva

5. `SeguimientoRiesgosPanel.tsx` - Panel de riesgos
   - Matriz 5x5 filtrada por proyecto
   - Acciones de mitigación

**Archivos a modificar:**
- `src/erp/screens/Seguimiento.tsx` - Reescribir completamente

**Imports necesarios:**
```tsx
import { ProyectoSelector } from '../components/shared';
import { StatusBadge, KPICard } from '../components/shared';
```

**Salida esperada:**
```
✅ 1 pantalla narrativa (antes: 5 tabs)
✅ -80% clics
✅ -70% tiempo
✅ 100% información en contexto
```

---

### FASE 4: Integrar Financiero.tsx (4 horas)
**Objetivo:** Consolidar Cuentas Cobrar/Pagar

**Cambios principales:**
```
ANTES:
├─ Financiero.tsx (aislado)
├─ CuentasCobrar.tsx (aislado)
├─ CuentasPagar.tsx (aislado)
└─ Múltiples clics + navegación

DESPUÉS:
├─ Financiero Dashboard (nuevo)
│  ├─ KPIs (Ingresos/Gastos/Utilidad)
│  ├─ Flujo Caja (12 meses)
│  ├─ Profitability by Project (tabla)
│  ├─ CuentasCobrar (aging integrado)
│  └─ CuentasPagar (vencimientos integrado)
└─ CuentasCobrar/Pagar como submódulos de Financiero
```

**Componentes a crear:**
1. `FinancieroDashboard.tsx` - Layout principal
2. `ProfitabilityTable.tsx` - Tabla de rentabilidad por proyecto
3. `CuentasModule.tsx` - Módulo unificado Cobrar+Pagar
4. `AgingReport.tsx` - Reporte de antigüedad

**Archivos a modificar:**
- `src/erp/screens/Financiero.tsx` - Agregar nuevas secciones
- `src/erp/screens/CuentasCobrar.tsx` - Convertir en componente embedido
- `src/erp/screens/CuentasPagar.tsx` - Convertir en componente embedido

**Pseudocódigo:**
```tsx
function Financiero() {
  const [filtroProyecto, setFiltroProyecto] = useState('todos');
  
  return (
    <div className="space-y-4">
      <Filters filtroProyecto={filtroProyecto} onChange={setFiltroProyecto} />
      
      <KPIGrid>
        <KPICard label="Ingresos" value={...} trend={...} />
        <KPICard label="Gastos" value={...} trend={...} />
        <KPICard label="Utilidad" value={...} trend={...} />
      </KPIGrid>
      
      <Grid cols={2}>
        <FlujoCajaChart data={...} />
        <GastosChart data={...} />
      </Grid>
      
      <ProfitabilityTable data={proyectos} onRowClick={...} />
      
      <Grid cols={2}>
        <CuentasCobrarPanel data={cuentasCobrar} />
        <CuentasPagarPanel data={cuentasPagar} />
      </Grid>
    </div>
  );
}
```

**Salida esperada:**
```
✅ Financiero integrado
✅ +40% rapidez en decisiones
✅ Cuentas consolidadas (1 lugar)
✅ Aging reports automáticos
```

---

### FASE 6: Refactorizar Proyectos.tsx (3 horas)
**Objetivo:** Grid simplificado + Modal de detalle

**Cambios principales:**
```
ANTES:
├─ Mapa de calor (200px overhead)
├─ Toolbar + Filtros
├─ 2 modos (grid/lista)
├─ Cards complejos
└─ Click → otra pantalla (Detalle)

DESPUÉS:
├─ Grid simplificado (sin mapa)
├─ Cards limpios (nombre + estado + avance + presupuesto)
├─ Click → Modal con tabs
│  ├─ Info
│  ├─ Avance
│  ├─ Riesgos
│  └─ Financiero
└─ Acciones contextuales en modal
```

**Componentes a crear:**
1. `ProyectoCardSimple.tsx` - Card simplificado
2. `ProyectoDetailModal.tsx` - Modal de detalle con tabs
3. `ProyectoInfoTab.tsx` - Tab de información
4. `ProyectoAvanceTab.tsx` - Tab de avance
5. `ProyectoRiesgosTab.tsx` - Tab de riesgos
6. `ProyectoFinancieroTab.tsx` - Tab de financiero

**Archivos a modificar:**
- `src/erp/screens/Proyectos.tsx` - Refactorizar layout

**Pseudocódigo:**
```tsx
function Proyectos() {
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  
  return (
    <div>
      <Toolbar search={...} sort={...} />
      
      <Grid cols={3}>
        {proyectos.map(p => (
          <ProyectoCardSimple
            proyecto={p}
            onClick={() => setSelectedProyecto(p.id)}
          />
        ))}
      </Grid>
      
      {selectedProyecto && (
        <ProyectoDetailModal
          proyectoId={selectedProyecto}
          onClose={() => setSelectedProyecto(null)}
        />
      )}
    </div>
  );
}
```

**Salida esperada:**
```
✅ UI más limpio
✅ -50% complejidad visual
✅ +100% información en contexto
```

---

## 📋 CHECKLIST PARA SESIÓN 2

### Antes de empezar:
- [ ] Leer `SESSION_1_COMPLETION_REPORT.md`
- [ ] Revisar componentes creados (KPICard, StatusBadge, etc)
- [ ] Entender nuevas estructuras (Dashboard + Sidebar)
- [ ] Preparar ambiente de desarrollo

### FASE 3 (Seguimiento):
- [x] Crear `SeguimientoStatusBar.tsx`
- [x] Crear `SeguimientoAnalysisPanel.tsx`
- [x] Crear `SeguimientoBitacoraPanel.tsx`
- [x] Crear `SeguimientoCronogramaPanel.tsx`
- [x] Crear `SeguimientoRiesgosPanel.tsx`
- [x] Refactorizar `Seguimiento.tsx`
- [x] Actualizar translation keys i18n
- [ ] Testar en desktop + mobile

### FASE 4 (Financiero):
- [x] Crear `ProfitabilityTable.tsx`
- [x] Crear `AgingReport.tsx`
- [x] Refactorizar `Financiero.tsx`
- [ ] Integrar `CuentasCobrar` inline
- [ ] Integrar `CuentasPagar` inline
- [ ] Agregar columna "Profitability" a tabla proyectos
- [ ] Testar cálculos

### FASE 6 (Proyectos):
- [x] Crear `ProyectoCardSimple.tsx`
- [ ] Crear `ProyectoDetailModal.tsx`
- [ ] Crear tabs dentro del modal
- [ ] Refactorizar `Proyectos.tsx`
- [ ] Remover mapa de calor
- [ ] Testar responsive

### Validación General:
- [ ] Build sin errores (`npm run build`)
- [ ] No hay warnings en console
- [ ] Responsive en mobile (<768px)
- [ ] Accesibilidad WCAG A mantenida
- [ ] Todas las traducciones actualizadas

---

## 🔗 REFERENCIAS IMPORTANTES

### Componentes ya creados (REUTILIZAR):
- `KPICard` - Para mostrar métricas con trend
- `StatusBadge` - Para estados de proyectos
- `VarianceBadge` - Para mostrar desviaciones
- `TableWithRowActions` - Para tablas con acciones
- `ExecutiveAlerts` - Para alertas
- `ProyectoSelector` - Para seleccionar proyecto

### Ejemplos de implementación:
- **Dashboard.tsx** - Ejemplo de cómo usar componentes
- **Sidebar.tsx** - Ejemplo de navegación mejorada

### Convenciones:
- **Naming:** PascalCase para componentes, camelCase para variables
- **Styling:** Tailwind classes (nunca CSS puro)
- **Types:** Siempre TypeScript interfaces
- **i18n:** Usar `t('nav.items.clave')` para strings

---

## 💾 CHECKPOINT STATE

**Archivos de Desarrollo:**
```
Crear en Sesión 2:
- src/erp/components/seguimiento/SeguimientoStatusBar.tsx
- src/erp/components/seguimiento/SeguimientoAnalysisPanel.tsx
- src/erp/components/seguimiento/SeguimientoBitacoraPanel.tsx
- src/erp/components/seguimiento/SeguimientoCronogramaPanel.tsx
- src/erp/components/seguimiento/SeguimientoRiesgosPanel.tsx
- src/erp/components/financiero/ProfitabilityTable.tsx
- src/erp/components/financiero/AgingReport.tsx
- src/erp/components/financiero/CuentasModule.tsx
- src/erp/components/proyectos/ProyectoCardSimple.tsx
- src/erp/components/proyectos/ProyectoDetailModal.tsx
- src/erp/components/proyectos/ProyectoInfoTab.tsx
- src/erp/components/proyectos/ProyectoAvanceTab.tsx
- src/erp/components/proyectos/ProyectoRiesgosTab.tsx
- src/erp/components/proyectos/ProyectoFinancieroTab.tsx

Modificar en Sesión 2:
- src/erp/screens/Seguimiento.tsx
- src/erp/screens/Financiero.tsx
- src/erp/screens/CuentasCobrar.tsx (→ componente)
- src/erp/screens/CuentasPagar.tsx (→ componente)
- src/erp/screens/Proyectos.tsx
- src/erp/i18n/es.json (traducciones nuevas)
```

---

## 🚀 COMIENZA SESIÓN 2 CON:

1. **Lee este archivo** (PENDING_WORK.md)
2. **Lee el reporte anterior** (SESSION_1_COMPLETION_REPORT.md)
3. **Revisa componentes base** (src/erp/components/shared/)
4. **Comienza FASE 3** (Seguimiento)
5. **Sigue el checklist** arriba

---

**Próxima sesión estimada:** 4 horas  
**Estado:** ✅ LISTO PARA REANUDAR  
**Última actualización:** 2026-12-27

---

*Contacto: Si hay dudas, revisar code comments en Dashboard.tsx o Sidebar.tsx como referencias*
