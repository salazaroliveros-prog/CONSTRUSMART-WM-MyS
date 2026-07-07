# Changelog

## [Unreleased]

### 🎨 UI/UX Refactorización Integral

- **Design System**: Variables semánticas unificadas en `design-tokens.css`, clases body para density/sidebar/touch
- **Tarjetas**: Nuevo componente `ElevatedCard` con sistema de elevación 1-5
- **Animaciones**: `Animations.tsx` con 8 componentes (PageTransition, AnimatedCounter, StaggerChildren, FadeIn, ScaleIn, SlideInRight, PulseDot, SkeletonCard, LoadingSpinner)
- **Temas**: 5 temas en `themes.ts` (Ant Design, Dark Pro, Material 3, Glassmorphism, Neomorphism)
- **Sidebar**: Configurable en posición (left/right/overlay), modo (expanded/collapsed/hover-expand/mini), ancho
- **Densidad**: Sistema global compact/normal/comfortable con CSS variables
- **Táctil**: Media query `@media (pointer: coarse)` + clase `.touch-mode`
- **Ajustes**: Controles para animationType, breadcrumbs, footer, touchMode
- **Backup**: Script `scripts/backup.cjs` para exportar/importar respaldos
- **Tests**: `components-ui.test.tsx` con 8 tests para ElevatedCard, FloatingLabelInput, PageTransition
- **Docs**: `GUIA_TEMAS.md` con guía completa de personalización
- **DB**: Migration 067 con índices estratégicos para performance