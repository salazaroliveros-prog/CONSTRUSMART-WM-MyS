import { useState, useEffect, useMemo } from 'react';

export type RolSistema = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

const DEFAULT_ROLES: Record<RolSistema, string[]> = {
  Administrador: [
    'dashboard','proyectos','presupuestos','seguimiento','financiero',
    'rrhh','bodega','crm','apu','baseprecios','muro','ordenes-cambio',
    'notificaciones','sso-calidad','documentos','visor-bim','predictivo',
    'exportacion','logistica','rendimiento-campo','comercial-fin',
    'admin-sistema','planilla-destajos','impuestos','entradas-almacen',
    'ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar',
    'cotizaciones','plantillas','proveedor-analytics','error-log',
    'activos','cuadros','profitability','weather','conflicts',
    'calidad-cumplimiento','auditoria','curvas-s',
  ],
  Gerente: [
    'dashboard','proyectos','presupuestos','seguimiento','financiero',
    'hitos','riesgos','ordenes-cambio','notificaciones','sso-calidad',
    'documentos','profitability','calidad-cumplimiento','curvas-s',
    'auditoria','apu','rendimiento-campo','baseprecios','muro',
    'visor-bim','predictivo','exportacion','comercial-fin',
  ],
  Residente: [
    'dashboard','proyectos','presupuestos','seguimiento','apu',
    'rendimiento-campo','baseprecios','muro','hitos','bodega',
    'ordenes-cambio','notificaciones','sso-calidad','documentos',
    'profitability','calidad-cumplimiento','curvas-s',
  ],
  Compras: [
    'dashboard','bodega','proyectos','cotizaciones',
    'proveedor-analytics','entradas-almacen',
  ],
  Bodeguero: [
    'dashboard','bodega',
  ],
};

const STORAGE_KEY = 'wm_roles_ui';

function loadRoles(): Record<RolSistema, string[]> {
  if (typeof window === 'undefined') return DEFAULT_ROLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ROLES;
    return { ...DEFAULT_ROLES, ...(JSON.parse(raw) as Partial<Record<RolSistema, string[]>>) };
  } catch {
    return DEFAULT_ROLES;
  }
}

export function useRoles() {
  const [roles, setRoles] = useState<Record<RolSistema, string[]>>(loadRoles);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
    } catch {
      // storage full or unavailable
    }
  }, [roles]);

  const asignarModulosARol = (rol: RolSistema, modulos: string[]) => {
    setRoles(prev => ({ ...prev, [rol]: Array.from(new Set(modulos)) }));
  };

  const obtenerModulosPorRol = (rol: RolSistema) => {
    return roles[rol] || DEFAULT_ROLES[rol] || [];
  };

  return {
    roles,
    asignarModulosARol,
    obtenerModulosPorRol,
    rolesPorDefecto: DEFAULT_ROLES,
  };
}
