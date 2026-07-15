/**
 * CONSTRUSMART ERP — Sincronización de Ajustes Visuales con el DOM
 *
 * ⚠️ Esta función ahora vive en src/lib/theme-manager.ts como fuente única.
 * Este archivo mantiene la interfaz VisualSettings y re-exporta
 * syncAllVisualSettings para compatibilidad con imports existentes.
 */

export interface VisualSettings {
  compactMode?: boolean;
  densityTable?: string;
  sidebarPosition?: 'left' | 'right';
  touchMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: string;
  borderRadius?: string;
  spacingScale?: string;
  animationsEnabled?: boolean;
  animationType?: string;
  breadcrumbsEnabled?: boolean;
  footerEnabled?: boolean;
}

export { syncAllVisualSettings } from './theme-manager';
export type { VisualSettings } from './theme-manager';
