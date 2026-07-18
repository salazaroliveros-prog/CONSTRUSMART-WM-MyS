import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getViewsByRole, sanitizarObjeto, tieneRolMinimo, sanitizarTexto, validarEmail } from '@/lib/security';
import type { View } from '@/erp/store';

describe('Security — RBAC / Sidebar / Sanitization', () => {
  describe('getViewsByRole', () => {
    it('Administrador receives all views', () => {
      const views = getViewsByRole('Administrador');
      expect(views).toContain('dashboard');
      expect(views).toContain('proyectos');
      expect(views).toContain('presupuestos');
      expect(views).toContain('conflicts');
      expect(views).toContain('auditoria');
      expect(views).toContain('error-log');
      expect(views).toContain('ajustes');
      expect(views.length).toBeGreaterThanOrEqual(41);
    });

    it('Gerente receives all views', () => {
      const views = getViewsByRole('Gerente');
      expect(views).toContain('dashboard');
      expect(views).toContain('proyectos');
      expect(views).toContain('presupuestos');
      expect(views).toContain('financiero');
      expect(views).toContain('auditoria');
      expect(views).toContain('conflicts');
      expect(views.length).toBeGreaterThanOrEqual(41);
    });

    it('Residente receives operational/obra views only', () => {
      const views = getViewsByRole('Residente');
      expect(views).toContain('dashboard');
      expect(views).toContain('proyectos');
      expect(views).toContain('seguimiento');
      expect(views).toContain('muro');
      expect(views).toContain('hitos');
      expect(views).toContain('ordenes-cambio');
      expect(views).toContain('rendimiento-campo');
      expect(views).toContain('documentos');
      expect(views).toContain('bodega');
      expect(views).toContain('calidad-cumplimiento');
      expect(views).not.toContain('financiero');
      expect(views).not.toContain('cuentas-cobrar');
      expect(views).not.toContain('admin-sistema');
    });

    it('Compras receives procurement views only', () => {
      const views = getViewsByRole('Compras');
      expect(views).toContain('dashboard');
      expect(views).toContain('cotizaciones');
      expect(views).toContain('proveedor-analytics');
      expect(views).toContain('bodega');
      expect(views).not.toContain('financiero');
      expect(views).not.toContain('cuentas-pagar');
    });

    it('Bodeguero receives warehouse views only', () => {
      const views = getViewsByRole('Bodeguero');
      expect(views).toContain('dashboard');
      expect(views).toContain('bodega');
      expect(views).not.toContain('proyectos');
      expect(views).not.toContain('financiero');
    });

    it('unknown role returns empty array', () => {
      const views = getViewsByRole('Desconocido' as any);
      expect(views).toEqual([]);
    });

    it('null role returns empty array', () => {
      const views = getViewsByRole(null as any);
      expect(views).toEqual([]);
    });
  });

  describe('tieneRolMinimo', () => {
    it('Admin passes any minimum', () => {
      expect(tieneRolMinimo('Administrador', 'Bodeguero')).toBe(true);
      expect(tieneRolMinimo('Administrador', 'Gerente')).toBe(true);
      expect(tieneRolMinimo('Administrador', 'Residente')).toBe(true);
    });

    it('Gerente passes Bodeguero/Compras/Residente minimums', () => {
      expect(tieneRolMinimo('Gerente', 'Bodeguero')).toBe(true);
      expect(tieneRolMinimo('Gerente', 'Residente')).toBe(true);
      expect(tieneRolMinimo('Gerente', 'Gerente')).toBe(true);
      expect(tieneRolMinimo('Gerente', 'Administrador')).toBe(false);
    });

    it('Bodeguero fails higher minimums', () => {
      expect(tieneRolMinimo('Bodeguero', 'Residente')).toBe(false);
      expect(tieneRolMinimo('Bodeguero', 'Gerente')).toBe(false);
    });

    it('null/undefined returns false', () => {
      expect(tieneRolMinimo(null, 'Bodeguero')).toBe(false);
      expect(tieneRolMinimo(undefined, 'Bodeguero')).toBe(false);
    });
  });

  describe('sanitizarObjeto', () => {
    it('removes dangerous HTML from strings', () => {
      const dirty = { nombre: '<script>alert(1)</script>Juan' };
      const clean = sanitizarObjeto(dirty);
      expect((clean as any).nombre).not.toContain('<script>');
    });

    it('preserves safe text', () => {
      const safe = { nombre: 'Juan Pérez' };
      const clean = sanitizarObjeto(safe);
      expect((clean as any).nombre).toBe('Juan Pérez');
    });

    it('handles nested objects', () => {
      const nested = { proyecto: { descripcion: '<img onerror=alert(1)>' } };
      const clean = sanitizarObjeto(nested);
      expect((clean as any).proyecto.descripcion).toContain('&#60;');
      expect((clean as any).proyecto.descripcion).not.toContain('<img');
    });

    it('does not mutate original object', () => {
      const original = { nombre: '<b>test</b>' };
      const copy = { ...original };
      sanitizarObjeto(original);
      expect(original.nombre).toBe(copy.nombre);
    });
  });

  describe('sanitizarTexto', () => {
    it('escapes script tags', () => {
      expect(sanitizarTexto('<script>alert(1)</script>')).not.toContain('<script>');
    });

    it('escapes HTML entities', () => {
      expect(sanitizarTexto('<div onclick="alert(1)">test</div>')).not.toContain('<div');
    });

    it('preserves safe text', () => {
      const result = sanitizarTexto('<p>Hello</p>');
      expect(result).toContain('Hello');
    });
  });

  describe('validarEmail', () => {
    it('accepts valid emails', () => {
      expect(validarEmail('user@test.com').valido).toBe(true);
      expect(validarEmail('admin@construsmart.gt').valido).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validarEmail('sin-arroba').valido).toBe(false);
      expect(validarEmail('@domain.com').valido).toBe(false);
      expect(validarEmail('user@').valido).toBe(false);
      expect(validarEmail('').valido).toBe(false);
    });
  });

  describe('Sidebar RBAC filtering', () => {
    const ALL_ITEMS: View[] = [
      'dashboard','proyectos','presupuestos','seguimiento','financiero','rrhh','bodega','crm','apu','baseprecios','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','visor-bim','predictivo','exportacion','logistica','rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos','impuestos','entradas-almacen','ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones','plantillas','proveedor-analytics','error-log','activos','cuadros','profitability','weather','conflicts','calidad-cumplimiento','auditoria','curvas-s'
    ];

    it('Administrador sees all sidebar items', () => {
      const allowed = getViewsByRole('Administrador');
      const visible = ALL_ITEMS.filter(id => allowed.includes(id));
      expect(visible.length).toBe(ALL_ITEMS.length);
    });

    it('Gerente sees all sidebar items', () => {
      const allowed = getViewsByRole('Gerente');
      const visible = ALL_ITEMS.filter(id => allowed.includes(id));
      expect(visible.length).toBe(ALL_ITEMS.length);
    });

    it('Residente sees only allowed subset', () => {
      const allowed = getViewsByRole('Residente');
      const visible = ALL_ITEMS.filter(id => allowed.includes(id));
      expect(visible.length).toBeGreaterThan(0);
      expect(visible.length).toBeLessThan(ALL_ITEMS.length);
    });

    it('Bodeguero sees minimal subset', () => {
      const allowed = getViewsByRole('Bodeguero');
      const visible = ALL_ITEMS.filter(id => allowed.includes(id));
      expect(visible.length).toBeLessThanOrEqual(5);
    });

    it('conflicts is visible for Administrador', () => {
      const allowed = getViewsByRole('Administrador');
      expect(allowed).toContain('conflicts');
    });

    it('conflicts is visible for Gerente', () => {
      const allowed = getViewsByRole('Gerente');
      expect(allowed).toContain('conflicts');
    });

    it('conflicts is not visible for Residente', () => {
      const allowed = getViewsByRole('Residente');
      expect(allowed).not.toContain('conflicts');
    });
  });

  describe('Security edge cases', () => {
    it('handles empty string role', () => {
      const views = getViewsByRole('' as any);
      expect(Array.isArray(views)).toBe(true);
    });

    it('handles role with whitespace', () => {
      const views = getViewsByRole('  Administrador  ' as any);
      expect(Array.isArray(views)).toBe(true);
    });

    it('sanitizarTexto handles null/undefined gracefully', () => {
      expect(sanitizarTexto(null as any)).toBe('');
      expect(sanitizarTexto(undefined as any)).toBe('');
      expect(sanitizarTexto(123 as any)).toBe('123');
    });
  });
});
