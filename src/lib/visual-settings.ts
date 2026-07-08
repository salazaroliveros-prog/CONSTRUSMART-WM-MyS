/**
 * CONSTRUSMART ERP — Sincronización de Ajustes Visuales con el DOM
 * Aplica las preferencias de appSettings a clases en <body>
 * y variables CSS custom properties.
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

const CLASS_PREFIX = 'vs-';

const classMap: Record<string, (v: any) => string | null> = {
  compactMode: (v) => v ? `${CLASS_PREFIX}compact` : null,
  touchMode: (v) => v ? `${CLASS_PREFIX}touch` : null,
  densityTable: (v) => v ? `${CLASS_PREFIX}density-${v}` : null,
  fontSize: (v) => v ? `${CLASS_PREFIX}font-${v}` : null,
  fontFamily: (v) => v ? `${CLASS_PREFIX}font-family-${v}` : null,
  borderRadius: (v) => v ? `${CLASS_PREFIX}radius-${v}` : null,
  spacingScale: (v) => v ? `${CLASS_PREFIX}spacing-${v}` : null,
  animationType: (v) => (v && v !== 'none') ? `${CLASS_PREFIX}anim-${v}` : null,
  sidebarPosition: (v) => v ? `${CLASS_PREFIX}sidebar-${v}` : null,
  animationsEnabled: (v) => v === false ? `${CLASS_PREFIX}anim-disabled` : null,
  breadcrumbsEnabled: (v) => v === false ? `${CLASS_PREFIX}breadcrumbs-hidden` : null,
  footerEnabled: (v) => v === false ? `${CLASS_PREFIX}footer-hidden` : null,
};

const cssVarMap: Record<string, (v: any) => [string, string] | null> = {
  compactMode: (v) => v ? ['--density-padding', '10px'] : ['--density-padding', '16px'],
  fontSize: (v) => {
    const sizes: Record<string, string> = { small: '14px', medium: '16px', large: '18px' };
    return ['--vs-font-size-base', sizes[v] || '16px'];
  },
  borderRadius: (v) => {
    const radii: Record<string, string> = { none: '0px', small: '4px', medium: '8px', large: '16px', full: '9999px' };
    return ['--radius-selected', radii[v] || '8px'];
  },
  spacingScale: (v) => {
    const scales: Record<string, string> = { compact: '8px', normal: '16px', spacious: '24px' };
    return ['--density-padding', scales[v] || '16px'];
  },
  touchMode: (v) => v ? ['--vs-touch-min-size', '44px'] : ['--vs-touch-min-size', '32px'],
};

export function syncAllVisualSettings(settings: VisualSettings): void {
  if (typeof document === 'undefined') return;
  const body = document.body;

  const classesToRemove: string[] = [];
  const classesToAdd: string[] = [];

  for (const [key, fn] of Object.entries(classMap)) {
    const value = (settings as any)[key];
    if (value !== undefined) {
      const result = fn(value);
      if (result) {
        classesToAdd.push(result);
      } else {
        if (key === 'compactMode') classesToRemove.push(`${CLASS_PREFIX}compact`);
        if (key === 'touchMode') classesToRemove.push(`${CLASS_PREFIX}touch`);
      }
    }
  }

  body.classList.remove(...classesToRemove.filter(Boolean));
  body.classList.add(...classesToAdd.filter(Boolean));

  for (const [key, fn] of Object.entries(cssVarMap)) {
    const value = (settings as any)[key];
    if (value !== undefined) {
      const result = fn(value);
      if (result) {
        body.style.setProperty(result[0], result[1]);
      }
    }
  }

  if (settings.animationsEnabled === false) {
    body.style.setProperty('--motion-duration-normal', '0ms');
    body.style.setProperty('--motion-duration-fast', '0ms');
  } else {
    body.style.removeProperty('--motion-duration-normal');
    body.style.removeProperty('--motion-duration-fast');
  }
}