/**
 * CONSTRUSMART ERP — Catálogo de Temas y Helpers
 *
 * Fuente de verdad para tipos y catálogo: theme-manager.ts
 * Este archivo re-exporta para mantener compatibilidad con imports existentes.
 */

export {
  ThemeName,
  ThemeInfo,
  ThemeConfig,
  VisualSettings,
  THEMES,
  PRIMARY_COLORS,
  VALID_THEMES,
  isValidTheme,
  hexToHSL,
  initializeTheme,
  applyThemeToDocument,
  syncAnimationsSetting,
  syncAllVisualSettings,
} from './theme-manager';
