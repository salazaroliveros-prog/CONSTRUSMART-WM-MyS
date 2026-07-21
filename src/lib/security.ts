export type RolSistema = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

export type View =
  | 'login'
  | 'dashboard'
  | 'proyectos'
  | 'presupuestos'
  | 'seguimiento'
  | 'financiero'
  | 'rrhh'
  | 'bodega'
  | 'crm'
  | 'apu'
  | 'baseprecios'
  | 'muro'
  | 'ordenes-cambio'
  | 'notificaciones'
  | 'sso-calidad'
  | 'documentos'
  | 'visor-bim'
  | 'predictivo'
  | 'exportacion'
  | 'logistica'
  | 'rendimiento-campo'
  | 'comercial-fin'
  | 'admin-sistema'
  | 'planilla-destajos'
  | 'impuestos'
  | 'entradas-almacen'
  | 'ajustes'
  | 'hitos'
  | 'riesgos'
  | 'cuentas-cobrar'
  | 'cuentas-pagar'
  | 'cotizaciones'
  | 'plantillas'
  | 'proveedor-analytics'
  | 'error-log'
  | 'activos'
  | 'cuadros'
  | 'profitability'
  | 'weather'
  | 'conflicts'
  | 'calidad-cumplimiento'
  | 'auditoria'
  | 'curvas-s';

export function getViewsByRole(rol: RolSistema): View[] {
  const ALL: View[] = [
    'dashboard','proyectos','presupuestos','seguimiento','financiero',
    'rrhh','bodega','crm','apu','rendimiento-campo','baseprecios',
    'muro','ordenes-cambio','notificaciones','sso-calidad',
    'documentos','visor-bim','predictivo','exportacion','logistica',
    'comercial-fin','admin-sistema','planilla-destajos',
    'impuestos','entradas-almacen','ajustes',
    'hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones',
    'plantillas','proveedor-analytics','error-log','activos','cuadros','profitability','weather',
    'conflicts','calidad-cumplimiento','auditoria','curvas-s'
  ];

  switch (rol) {
    case 'Administrador': return ALL;
    case 'Gerente': return [
      'dashboard','proyectos','presupuestos','seguimiento','financiero',
      'hitos','riesgos','ordenes-cambio','notificaciones','sso-calidad',
      'documentos','profitability','calidad-cumplimiento','curvas-s','auditoria',
      'apu','rendimiento-campo','baseprecios','muro','visor-bim','predictivo',
      'exportacion','comercial-fin'
    ];
    case 'Residente': return ['dashboard','proyectos','presupuestos','seguimiento','apu',
      'rendimiento-campo','baseprecios','muro','hitos','bodega',
      'ordenes-cambio','notificaciones','sso-calidad','documentos','profitability',
      'calidad-cumplimiento','curvas-s'];
    case 'Compras': return ['dashboard','bodega','proyectos','cotizaciones','proveedor-analytics','entradas-almacen'];
    case 'Bodeguero': return ['dashboard','bodega'];
    default: return [];
  }
}

export function canUserEdit(rol: RolSistema | null | undefined): boolean {
  return rol === 'Administrador' || rol === 'Gerente';
}

export function canUserDelete(rol: RolSistema | null | undefined): boolean {
  return rol === 'Administrador';
}

export function hasViewAccess(rol: RolSistema | null | undefined, view: View): boolean {
  if (!rol) return false;
  return getViewsByRole(rol).includes(view);
}

export function sanitizarObjeto(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const SENSITIVE = new Set(['password','token','secret','key','authorization','cookie','session']);
  const out: any = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const lk = k.toLowerCase();
    if (SENSITIVE.has(lk)) continue;
    const v = (obj as any)[k];
    out[k] = v && typeof v === 'object' ? sanitizarObjeto(v) : v;
  }
  return out;
}

export function sanitizarTexto(texto: string): string {
  if (typeof texto !== 'string') return '';
  const limpio = texto.replace(/[^\u0020-\u007E]+/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio;
}
