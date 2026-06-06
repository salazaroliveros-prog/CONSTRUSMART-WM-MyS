# CONTEXT.md: ERP CONSTRUSMART

## Propósito
ERP integral para gestión de proyectos de construcción.

## Stack Tecnológico
- **Frontend:** React + TypeScript + Vite.
- **UI:** Shadcn UI.
- **Backend/BaaS:** Supabase (PostgreSQL).
- **Herramientas Clave:** Zod (validación), D3.js (gráficos), Web-IFC (visor BIM).

## Estructura de Módulos
- `/src/erp`: Lógica de negocio, componentes específicos del ERP, almacenamiento local, estados.
- `/src/components/ui`: Componentes compartidos basados en Shadcn.
- `/supabase/migrations`: Definición de la base de datos y políticas de seguridad (RLS).
- `/src/functions`: Lógica de servidor serverless (Edge Functions).

---

## 🎨 AUDITORÍA UX/UI - JUNIO 2026

### 📚 ¿POR DÓNDE EMPEZAR?
👉 **Lee primero: [READING_GUIDE.md](READING_GUIDE.md)** - Te ayuda elegir qué documento leer según tu tiempo y rol.

### 📋 Documentación de Auditoría (8 archivos)

**Resúmenes rápidos:**
1. **[READING_GUIDE.md](READING_GUIDE.md)** ← Empieza aquí
   - Guía de navegación según tu rol y tiempo disponible
   - Matriz de qué leer
   - Paths de lectura recomendados

2. **[AUDIT_SUMMARY_SHARE.md](AUDIT_SUMMARY_SHARE.md)** 
   - Resumen visual para compartir (1-2 páginas)
   - 5 problemas críticos
   - Business case en números

**Para implementación:**
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** 🔍
   - Copy-paste ready patterns (búsqueda/reemplazo)
   - Quick actions pre-generadas
   - Checkpoints de validación
   - Usa esto durante implementación

4. **[TECHNICAL_IMPLEMENTATION_GUIDE.md](TECHNICAL_IMPLEMENTATION_GUIDE.md)**
   - Paleta de colores normalizada (HSL values)
   - Escala tipográfica con Tailwind
   - Code snippets listos
   - Guía completa WCAG AA

**Análisis detallado:**
5. **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)**
   - Para stakeholders y decisión makers
   - ROI y cálculos de inversión
   - Plan de 3 fases
   - Quick wins identificados

6. **[UX_UI_AUDIT_CONSISTENCY.md](UX_UI_AUDIT_CONSISTENCY.md)** ⭐
   - 87 hallazgos completamente categorizados
   - Ubicación exacta de cada bug
   - Matriz de priorización (impacto vs esfuerzo)
   - Checklist de validación

7. **[VISUAL_ANALYSIS_MATRICES.md](VISUAL_ANALYSIS_MATRICES.md)**
   - Gráficos y matrices de datos
   - Mapa térmico de severidad
   - Timeline estimado
   - Comparación before/after

8. **[AUDIT_MASTER_INDEX.md](AUDIT_MASTER_INDEX.md)**
   - Centro de control
   - Matriz de navegación
   - Flujos de trabajo
   - Referencias cruzadas

### 📊 Hallazgos en Números
- **87 hallazgos** encontrados
- **16 críticos** (dark mode roto, sin focus states, hardcoded colors)
- **28 altos** (mobile experience, accesibilidad WCAG)
- **32 medios** (tipografía, espaciado, responsive)
- **11 menores** (inconsistencias visuales menores)

### ✅ Plan de Acción
**Fase 1 (1-2 días):** Dark mode + Accesibilidad base  
**Fase 2 (2-3 días):** Tipografía + Responsive design  
**Fase 3 (2-3 días):** Animaciones + QA final  

**Timeline total:** 8-10 días (1 dev) | 4-5 días (2 devs)  
**Inversión:** $3,200-4,000 | ROI positivo en 2-3 sprints
