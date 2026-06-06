/**
 * ♿ Utilidad de validación de contraste WCAG
 * Basado en: TECHNICAL_IMPLEMENTATION_GUIDE.md - Accesibilidad
 */

/**
 * Calcula el luminance relativa de un color (WCAG formula)
 * @param hex - Color hexadecimal (e.g., #E8752F)
 */
function getLuminance(hex: string): number {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16) / 255;
  const g = parseInt(sanitized.substring(2, 4), 16) / 255;
  const b = parseInt(sanitized.substring(4, 6), 16) / 255;

  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Calcula el ratio de contraste entre dos colores
 * @param color1 - Primer color hex
 * @param color2 - Segundo color hex
 * @returns Ratio de contraste (e.g., 4.5:1 → retorna 4.5)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Verifica si cumple WCAG AA para texto normal (4.5:1)
 */
export function isWCAGAA(ratio: number): boolean {
  return ratio >= 4.5;
}

/**
 * Verifica si cumple WCAG AA para texto grande (3:1)
 */
export function isWCAGAALargeText(ratio: number): boolean {
  return ratio >= 3.0;
}

/**
 * Verifica si cumple WCAG AAA para texto normal (7:1)
 */
export function isWCAGAAA(ratio: number): boolean {
  return ratio >= 7.0;
}

/**
 * Valida un par de colores y devuelve resultado detallado
 */
export function validateContrast(foreground: string, background: string, isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: isLargeText ? isWCAGAALargeText(ratio) : isWCAGAA(ratio),
    wcagAAALargeText: isWCAGAALargeText(ratio),
    wcagAAA: isWCAGAAA(ratio),
    pass: isLargeText ? isWCAGAALargeText(ratio) : isWCAGAA(ratio),
  };
}

/**
 * Colores CONSTRUSMART pre-validados
 */
export const construsmartColors = {
  primary: '#E8752F',
  primaryDark: '#E8852F',
  background: '#fef3e8',
  backgroundDark: '#0d1117',
  foreground: '#2a1810',
  foregroundDark: '#f0f4f8',
  white: '#ffffff',
  success: '#2d9d6f',
  warning: '#ffa500',
  destructive: '#e73d3d',
} as const;