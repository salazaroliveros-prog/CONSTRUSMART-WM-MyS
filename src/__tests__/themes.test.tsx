import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  THEMES,
  PRIMARY_COLORS,
  initializeTheme,
  applyThemeToDocument,
  syncAnimationsSetting,
  syncAllVisualSettings,
  type ThemeName,
} from '@/lib/themes';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ALL_THEMES: ThemeName[] = ['ant-design', 'dark-pro', 'material3', 'glassmorphism', 'neomorphism'];

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-font-size');
  document.documentElement.removeAttribute('data-sidebar-mode');
  document.documentElement.removeAttribute('data-breadcrumbs-enabled');
  document.documentElement.removeAttribute('data-footer-enabled');
  document.documentElement.className = '';
  document.body.className = '';
  document.documentElement.style.cssText = '';
  localStorage.clear();
});

// ─── THEMES constant ────────────────────────────────────────────────────────

describe('THEMES constant', () => {
  it('contiene los 5 temas esperados', () => {
    expect(Object.keys(THEMES)).toEqual(ALL_THEMES);
  });

  it.each(ALL_THEMES)('tema %s tiene label, description y colors válidos', (name) => {
    const t = THEMES[name];
    expect(t.label).toBeTruthy();
    expect(t.description).toBeTruthy();
    expect(t.colors.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t.colors.background).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t.colors.foreground).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('dark-pro tiene background oscuro', () => {
    expect(THEMES['dark-pro'].colors.background).toBe('#0d1b2a');
  });
});

// ─── PRIMARY_COLORS ─────────────────────────────────────────────────────────

describe('PRIMARY_COLORS', () => {
  it('tiene al menos 5 colores', () => {
    expect(PRIMARY_COLORS.length).toBeGreaterThanOrEqual(5);
  });

  it('cada color tiene label y value hex válido', () => {
    PRIMARY_COLORS.forEach(c => {
      expect(c.label).toBeTruthy();
      expect(c.value).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

// ─── initializeTheme ────────────────────────────────────────────────────────

describe('initializeTheme', () => {
  it('aplica data-theme desde localStorage', () => {
    localStorage.setItem('wm_erp_theme', 'material3');
    initializeTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('material3');
  });

  it('usa ant-design como fallback si no hay localStorage', () => {
    initializeTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('ant-design');
  });

  it('agrega clase dark para dark-pro', () => {
    localStorage.setItem('wm_erp_theme', 'dark-pro');
    initializeTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('no agrega clase dark para temas claros', () => {
    localStorage.setItem('wm_erp_theme', 'ant-design');
    initializeTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('aplica compactMode desde wm_erp_data_settings', () => {
    localStorage.setItem('wm_erp_data_settings', JSON.stringify({ compactMode: true }));
    initializeTheme();
    expect(document.documentElement.classList.contains('compact')).toBe(true);
  });

  it('aplica primaryColor desde wm_erp_data_settings', () => {
    localStorage.setItem('wm_erp_data_settings', JSON.stringify({ primaryColor: '#ff8c42' }));
    initializeTheme();
    expect(document.documentElement.style.getPropertyValue('--primary')).toBeTruthy();
  });

  it('no lanza si localStorage tiene JSON inválido', () => {
    localStorage.setItem('wm_erp_data_settings', 'INVALID_JSON');
    expect(() => initializeTheme()).not.toThrow();
  });
});

// ─── applyThemeToDocument ───────────────────────────────────────────────────

describe('applyThemeToDocument', () => {
  it('aplica data-theme al documentElement', () => {
    applyThemeToDocument({ appTheme: 'glassmorphism' });
    expect(document.documentElement.getAttribute('data-theme')).toBe('glassmorphism');
  });

  it('activa clase dark para dark-pro', () => {
    applyThemeToDocument({ appTheme: 'dark-pro' });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('desactiva clase dark para temas claros', () => {
    document.documentElement.classList.add('dark');
    applyThemeToDocument({ appTheme: 'ant-design' });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('aplica compactMode true', () => {
    applyThemeToDocument({ compactMode: true });
    expect(document.documentElement.classList.contains('compact')).toBe(true);
  });

  it('aplica compactMode false', () => {
    document.documentElement.classList.add('compact');
    applyThemeToDocument({ compactMode: false });
    expect(document.documentElement.classList.contains('compact')).toBe(false);
  });

  it('aplica primaryColor como CSS variable HSL', () => {
    applyThemeToDocument({ primaryColor: '#1677ff' });
    expect(document.documentElement.style.getPropertyValue('--primary')).toBeTruthy();
  });

  it('no lanza con config vacío', () => {
    expect(() => applyThemeToDocument({})).not.toThrow();
  });

  it('no lanza con config null/undefined', () => {
    expect(() => applyThemeToDocument(null as any)).not.toThrow();
  });
});

// ─── syncAnimationsSetting ──────────────────────────────────────────────────

describe('syncAnimationsSetting', () => {
  it('agrega animations-disabled cuando enabled=false', () => {
    syncAnimationsSetting(false);
    expect(document.documentElement.classList.contains('animations-disabled')).toBe(true);
  });

  it('remueve animations-disabled cuando enabled=true', () => {
    document.documentElement.classList.add('animations-disabled');
    syncAnimationsSetting(true);
    expect(document.documentElement.classList.contains('animations-disabled')).toBe(false);
  });
});

// ─── syncAllVisualSettings ──────────────────────────────────────────────────

describe('syncAllVisualSettings', () => {
  it('aplica appTheme y dark mode', () => {
    syncAllVisualSettings({ appTheme: 'dark-pro' });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark-pro');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('aplica fontSize como data-font-size', () => {
    syncAllVisualSettings({ fontSize: 'large' });
    expect(document.documentElement.getAttribute('data-font-size')).toBe('large');
  });

  it.each([
    ['none', '0px'],
    ['small', '4px'],
    ['medium', '6px'],
    ['large', '12px'],
    ['full', '9999px'],
  ])('borderRadius %s → --radius-selected %s', (radius, expected) => {
    syncAllVisualSettings({ borderRadius: radius });
    expect(document.documentElement.style.getPropertyValue('--radius-selected')).toBe(expected);
  });

  it.each([
    ['compact', '4px'],
    ['normal', '8px'],
    ['spacious', '16px'],
  ])('spacingScale %s → --spacing-selected %s', (scale, expected) => {
    syncAllVisualSettings({ spacingScale: scale });
    expect(document.documentElement.style.getPropertyValue('--spacing-selected')).toBe(expected);
  });

  it.each(['compact', 'normal', 'comfortable'])('densityTable %s agrega clase density-%s', (density) => {
    syncAllVisualSettings({ densityTable: density });
    expect(document.body.classList.contains(`density-${density}`)).toBe(true);
  });

  it('densityTable remueve clases previas', () => {
    document.body.classList.add('density-compact');
    syncAllVisualSettings({ densityTable: 'comfortable' });
    expect(document.body.classList.contains('density-compact')).toBe(false);
    expect(document.body.classList.contains('density-comfortable')).toBe(true);
  });

  it.each(['left', 'right', 'overlay'])('sidebarPosition %s agrega clase sidebar-%s', (pos) => {
    syncAllVisualSettings({ sidebarPosition: pos });
    expect(document.body.classList.contains(`sidebar-${pos}`)).toBe(true);
  });

  it('sidebarWidth aplica --sidebar-width', () => {
    syncAllVisualSettings({ sidebarWidth: 280 });
    expect(document.documentElement.style.getPropertyValue('--sidebar-width')).toBe('280px');
  });

  it('breadcrumbsEnabled=false aplica data-breadcrumbs-enabled=false', () => {
    syncAllVisualSettings({ breadcrumbsEnabled: false });
    expect(document.documentElement.getAttribute('data-breadcrumbs-enabled')).toBe('false');
  });

  it('footerEnabled=true aplica data-footer-enabled=true', () => {
    syncAllVisualSettings({ footerEnabled: true });
    expect(document.documentElement.getAttribute('data-footer-enabled')).toBe('true');
  });

  it('touchMode=true agrega clase touch-mode al body', () => {
    syncAllVisualSettings({ touchMode: true });
    expect(document.body.classList.contains('touch-mode')).toBe(true);
  });

  it('touchMode=false remueve clase touch-mode', () => {
    document.body.classList.add('touch-mode');
    syncAllVisualSettings({ touchMode: false });
    expect(document.body.classList.contains('touch-mode')).toBe(false);
  });

  it('animationsEnabled=false agrega animations-disabled', () => {
    syncAllVisualSettings({ animationsEnabled: false });
    expect(document.documentElement.classList.contains('animations-disabled')).toBe(true);
  });

  it('no lanza con objeto vacío', () => {
    expect(() => syncAllVisualSettings({})).not.toThrow();
  });

  it.each(['inter', 'roboto', 'open-sans', 'poppins', 'system-ui'])(
    'fontFamily %s aplica --font-family',
    (font) => {
      syncAllVisualSettings({ fontFamily: font });
      expect(document.documentElement.style.getPropertyValue('--font-family')).toBeTruthy();
    },
  );
});
