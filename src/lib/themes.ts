export type ThemeName = 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism'

export interface ThemeColors {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  card: string
  cardForeground: string
  destructive: string
  destructiveForeground: string
  ring: string
}

export interface ThemeConfig {
  name: ThemeName
  label: string
  description: string
  colors: ThemeColors
  cssVars: Record<string, string>
  styles: {
    borderRadius: string
    shadows: {
      sm: string
      md: string
      lg: string
      xl: string
    }
    transitions: {
      fast: string
      base: string
      slow: string
    }
    backdropBlur?: string
  }
}

// TEMA 1: ANT DESIGN (Actual)
export const THEME_ANT_DESIGN: ThemeConfig = {
  name: 'ant-design',
  label: 'Ant Design',
  description: 'Diseño limpio y profesional con colores claros',
  colors: {
    primary: '#1890ff',
    primaryForeground: '#ffffff',
    secondary: '#722ed1',
    secondaryForeground: '#ffffff',
    accent: '#ff8c42',
    accentForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#000000',
    muted: '#f5f5f5',
    mutedForeground: '#8c8c8c',
    border: '#d9d9d9',
    input: '#ffffff',
    card: '#ffffff',
    cardForeground: '#000000',
    destructive: '#ff4d4f',
    destructiveForeground: '#ffffff',
    ring: '#1890ff',
  },
  cssVars: {
    '--primary': '221 83% 53%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '280 85% 44%',
    '--secondary-foreground': '210 40% 98%',
    '--accent': '39 89% 63%',
    '--accent-foreground': '222.2 47.4% 11.2%',
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
    '--muted': '210 40% 96.1%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',
    '--ring': '221 83% 53%',
  },
  styles: {
    borderRadius: '4px',
    shadows: {
      sm: '0 2px 4px rgba(0,0,0,0.08)',
      md: '0 4px 8px rgba(0,0,0,0.12)',
      lg: '0 8px 16px rgba(0,0,0,0.15)',
      xl: '0 12px 24px rgba(0,0,0,0.2)',
    },
    transitions: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
}

// TEMA 2: DARK PRO (Premium Dark)
export const THEME_DARK_PRO: ThemeConfig = {
  name: 'dark-pro',
  label: 'Dark Pro',
  description: 'Modo oscuro profesional con acentos vibrantes',
  colors: {
    primary: '#00d9ff',
    primaryForeground: '#0a0e27',
    secondary: '#9d4edd',
    secondaryForeground: '#ffffff',
    accent: '#ff006e',
    accentForeground: '#ffffff',
    background: '#0a0e27',
    foreground: '#e0e0e0',
    muted: '#1a1f3a',
    mutedForeground: '#a0a0a0',
    border: '#2a2f4a',
    input: '#151b33',
    card: '#1a1f3a',
    cardForeground: '#e0e0e0',
    destructive: '#ff5555',
    destructiveForeground: '#ffffff',
    ring: '#00d9ff',
  },
  cssVars: {
    '--primary': '180 100% 50%',
    '--primary-foreground': '225 50% 15%',
    '--secondary': '280 50% 50%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '326 100% 50%',
    '--accent-foreground': '0 0% 100%',
    '--background': '225 20% 10%',
    '--foreground': '0 0% 88%',
    '--muted': '225 15% 12%',
    '--muted-foreground': '0 0% 63%',
    '--border': '225 20% 18%',
    '--input': '225 25% 8%',
    '--card': '225 15% 12%',
    '--card-foreground': '0 0% 88%',
    '--destructive': '0 100% 67%',
    '--destructive-foreground': '0 0% 100%',
    '--ring': '180 100% 50%',
  },
  styles: {
    borderRadius: '12px',
    shadows: {
      sm: '0 4px 12px rgba(0, 217, 255, 0.1)',
      md: '0 8px 24px rgba(0, 217, 255, 0.15)',
      lg: '0 16px 40px rgba(0, 217, 255, 0.2)',
      xl: '0 24px 48px rgba(0, 217, 255, 0.25)',
    },
    transitions: {
      fast: '150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      base: '250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      slow: '350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
}

// TEMA 3: MATERIAL 3
export const THEME_MATERIAL3: ThemeConfig = {
  name: 'material3',
  label: 'Material 3',
  description: 'Material Design 3 con transiciones fluidas',
  colors: {
    primary: '#6200ea',
    primaryForeground: '#ffffff',
    secondary: '#03dac6',
    secondaryForeground: '#000000',
    accent: '#ff6e40',
    accentForeground: '#ffffff',
    background: '#fffbfe',
    foreground: '#1c1b1f',
    muted: '#f4f3f7',
    mutedForeground: '#605e6c',
    border: '#ede7f6',
    input: '#ffffff',
    card: '#ffffff',
    cardForeground: '#1c1b1f',
    destructive: '#b3261e',
    destructiveForeground: '#ffffff',
    ring: '#6200ea',
  },
  cssVars: {
    '--primary': '268 99% 46%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '174 100% 43%',
    '--secondary-foreground': '0 0% 0%',
    '--accent': '14 100% 60%',
    '--accent-foreground': '0 0% 100%',
    '--background': '324 100% 99%',
    '--foreground': '270 5% 11%',
    '--muted': '270 10% 97%',
    '--muted-foreground': '270 3% 38%',
    '--border': '270 14% 94%',
    '--input': '0 0% 100%',
    '--card': '0 0% 100%',
    '--card-foreground': '270 5% 11%',
    '--destructive': '11 89% 35%',
    '--destructive-foreground': '0 0% 100%',
    '--ring': '268 99% 46%',
  },
  styles: {
    borderRadius: '12px',
    shadows: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      md: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
      lg: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
      xl: '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
    },
    transitions: {
      fast: '150ms cubic-bezier(0.4, 0, 1, 1)',
      base: '250ms cubic-bezier(0.3, 0, 0.8, 0.15)',
      slow: '350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },
}

// TEMA 4: GLASSMORPHISM
export const THEME_GLASSMORPHISM: ThemeConfig = {
  name: 'glassmorphism',
  label: 'Glassmorphism',
  description: 'Efecto de vidrio esmerilado y transparencia',
  colors: {
    primary: '#00b4d8',
    primaryForeground: '#ffffff',
    secondary: '#8338ec',
    secondaryForeground: '#ffffff',
    accent: '#fb5607',
    accentForeground: '#ffffff',
    background: '#e3f2fd',
    foreground: '#0d1b2a',
    muted: '#cfe9f3',
    mutedForeground: '#1d3557',
    border: '#b8e0d2',
    input: 'rgba(255, 255, 255, 0.7)',
    card: 'rgba(255, 255, 255, 0.5)',
    cardForeground: '#0d1b2a',
    destructive: '#ef476f',
    destructiveForeground: '#ffffff',
    ring: '#00b4d8',
  },
  cssVars: {
    '--primary': '191 100% 42%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '266 100% 45%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '18 99% 55%',
    '--accent-foreground': '0 0% 100%',
    '--background': '210 93% 96%',
    '--foreground': '210 35% 10%',
    '--muted': '193 72% 81%',
    '--muted-foreground': '210 35% 35%',
    '--border': '158 72% 74%',
    '--input': '0 0% 100% / 0.7',
    '--card': '0 0% 100% / 0.5',
    '--card-foreground': '210 35% 10%',
    '--destructive': '348 100% 59%',
    '--destructive-foreground': '0 0% 100%',
    '--ring': '191 100% 42%',
  },
  styles: {
    borderRadius: '20px',
    shadows: {
      sm: '0 8px 32px rgba(31, 38, 135, 0.15)',
      md: '0 8px 32px rgba(31, 38, 135, 0.25)',
      lg: '0 16px 48px rgba(31, 38, 135, 0.35)',
      xl: '0 24px 64px rgba(31, 38, 135, 0.45)',
    },
    transitions: {
      fast: '150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      base: '300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      slow: '500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    backdropBlur: 'blur(20px)',
  },
}

// TEMA 5: NEOMORPHISM
export const THEME_NEOMORPHISM: ThemeConfig = {
  name: 'neomorphism',
  label: 'Neomorphism',
  description: 'Suave, minimalista con profundidad sutil',
  colors: {
    primary: '#5f6368',
    primaryForeground: '#ffffff',
    secondary: '#f9ab00',
    secondaryForeground: '#ffffff',
    accent: '#1f9e83',
    accentForeground: '#ffffff',
    background: '#e8ebf0',
    foreground: '#4f5359',
    muted: '#dadce0',
    mutedForeground: '#80868b',
    border: '#d1d5da',
    input: '#e8ebf0',
    card: '#f5f7fa',
    cardForeground: '#4f5359',
    destructive: '#d33b27',
    destructiveForeground: '#ffffff',
    ring: '#5f6368',
  },
  cssVars: {
    '--primary': '219 8% 42%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '43 100% 49%',
    '--secondary-foreground': '0 0% 100%',
    '--accent': '165 47% 41%',
    '--accent-foreground': '0 0% 100%',
    '--background': '211 17% 94%',
    '--foreground': '219 8% 33%',
    '--muted': '212 6% 87%',
    '--muted-foreground': '212 4% 55%',
    '--border': '212 9% 82%',
    '--input': '211 17% 94%',
    '--card': '210 9% 98%',
    '--card-foreground': '219 8% 33%',
    '--destructive': '8 68% 52%',
    '--destructive-foreground': '0 0% 100%',
    '--ring': '219 8% 42%',
  },
  styles: {
    borderRadius: '16px',
    shadows: {
      sm: '4px 4px 8px rgba(0, 0, 0, 0.08), -2px -2px 4px rgba(255, 255, 255, 0.8)',
      md: '6px 6px 12px rgba(0, 0, 0, 0.1), -3px -3px 6px rgba(255, 255, 255, 0.9)',
      lg: '8px 8px 16px rgba(0, 0, 0, 0.12), -4px -4px 8px rgba(255, 255, 255, 1)',
      xl: '12px 12px 24px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 1)',
    },
    transitions: {
      fast: '200ms ease-in-out',
      base: '300ms ease-in-out',
      slow: '500ms ease-in-out',
    },
  },
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  'ant-design': THEME_ANT_DESIGN,
  'dark-pro': THEME_DARK_PRO,
  'material3': THEME_MATERIAL3,
  'glassmorphism': THEME_GLASSMORPHISM,
  'neomorphism': THEME_NEOMORPHISM,
}

export const applyTheme = (theme: ThemeConfig) => {
  const root = document.documentElement

  // Aplicar colores CSS variables
  Object.entries(theme.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  // Aplicar estilos globales
  root.style.setProperty('--border-radius', theme.styles.borderRadius)
  root.style.setProperty('--shadow-sm', theme.styles.shadows.sm)
  root.style.setProperty('--shadow-md', theme.styles.shadows.md)
  root.style.setProperty('--shadow-lg', theme.styles.shadows.lg)
  root.style.setProperty('--shadow-xl', theme.styles.shadows.xl)
  root.style.setProperty('--transition-fast', theme.styles.transitions.fast)
  root.style.setProperty('--transition-base', theme.styles.transitions.base)
  root.style.setProperty('--transition-slow', theme.styles.transitions.slow)

  if (theme.styles.backdropBlur) {
    root.style.setProperty('--backdrop-blur', theme.styles.backdropBlur)
  }

  // Guardar tema activo
  localStorage.setItem('wm_erp_theme', theme.name)
  document.documentElement.setAttribute('data-theme', theme.name)
}

export const getStoredTheme = (): ThemeName => {
  const stored = localStorage.getItem('wm_erp_theme')
  return (stored as ThemeName) || 'ant-design'
}

export const initializeTheme = () => {
  const themeName = getStoredTheme()
  const theme = THEMES[themeName]
  if (theme) applyTheme(theme)
}
