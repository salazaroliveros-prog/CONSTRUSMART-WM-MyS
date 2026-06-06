/**
 * 🎨 Clases de tipografía normalizadas para CONSTRUSMART ERP
 * Basado en: TECHNICAL_IMPLEMENTATION_GUIDE.md - Escala tipográfica normalizada
 */

export const typographyClasses = {
  /** Page title (H1): 24px sm:30px, bold, tracking-tight */
  h1: 'text-2xl md:text-3xl font-bold tracking-tight',
  /** Section title (H2): 20px sm:24px, semibold, tracking-tight */
  h2: 'text-xl md:text-2xl font-semibold tracking-tight',
  /** Card title (H3): 18px sm:20px, semibold, tracking-tight */
  h3: 'text-lg md:text-xl font-semibold tracking-tight',
  /** Body text: 16px, normal, leading-relaxed */
  body: 'text-base leading-relaxed',
  /** Label text: 14px, medium, subtle color */
  label: 'text-sm font-medium text-foreground/90',
  /** Caption text: 12px, muted color */
  caption: 'text-xs text-muted-foreground',
  /** Button text: 14px, semibold */
  button: 'text-sm font-semibold',
  /** Inline code: 14px, monospace, background */
  code: 'text-sm font-mono bg-muted px-1.5 py-0.5 rounded',
} as const;

export type TypographyKey = keyof typeof typographyClasses;