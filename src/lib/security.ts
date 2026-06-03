/**
 * Módulo de seguridad centralizado para CONSTRUSMART ERP
 * 
 * Funciones:
 * - Verificación server-side de roles via Supabase RPC
 * - Sanitización XSS (escapado HTML)
 * - Jerarquía de roles autoritativa
 * - Validación de permisos para operaciones CRUD
 */

import { hasSupabase, assertSupabase } from './supabase';

// ============================================================
// TIPOS COMPARTIDOS
// ============================================================

export type RolSistema = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' |
  'financiero' | 'rrhh' | 'bodega' | 'crm' | 'apu' | 'curvas' | 'rendimientos' |
  'baseprecios' | 'reportes' | 'muro' | 'ordenes-cambio' | 'notificaciones' |
  'sso-calidad' | 'documentos' | 'visor-bim' | 'predictivo' | 'exportacion' |
  'logistica' | 'rendimiento-campo' | 'comercial-fin' | 'admin-sistema' |
  'planilla-destajos' | 'impuestos' | 'entradas-almacen';

// ============================================================
// JERARQUIA DE ROLES
// ============================================================

const ROLES_JERARQUIA: Record<RolSistema, number> = {
  Administrador: 100,
  Gerente: 80,
  Residente: 60,
  Compras: 40,
  Bodeguero: 20,
};

interface ServerRoleCheck {
  user_id: string;
  rol: RolSistema | null;
  nombre: string;
  authenticated: boolean;
}

// ============================================================
// VERIFICACION SERVER-SIDE DE ROLES
// ============================================================

/**
 * Obtiene el rol verificado desde Supabase (via RPC SECURITY DEFINER)
 * No puede ser falseado desde el cliente
 */
export async function getServerRole(): Promise<ServerRoleCheck | null> {
  if (!hasSupabase) return null;
  try {
    const client = assertSupabase();
    const { data, error } = await client.rpc('verificar_rol_usuario');
    if (error) {
      console.error('[Security] Error verificando rol:', error.message);
      return null;
    }
    return data as ServerRoleCheck;
  } catch (err) {
    console.error('[Security] Error en getServerRole:', err);
    return null;
  }
}

/**
 * Verifica si el usuario tiene un rol minimo requerido
 * Jerarquia: Admin(100) > Gerente(80) > Residente(60) > Compras(40) > Bodeguero(20)
 */
export function tieneRolMinimo(
  rolUsuario: RolSistema | null | undefined,
  rolMinimoRequerido: RolSistema
): boolean {
  if (!rolUsuario) return false;
  const nivelUsuario = ROLES_JERARQUIA[rolUsuario] ?? 0;
  const nivelRequerido = ROLES_JERARQUIA[rolMinimoRequerido] ?? 0;
  return nivelUsuario >= nivelRequerido;
}

/**
 * Mapa autoritativo de vistas por rol
 * Fuente unica de verdad - usar en lugar de ALLOWED en store.tsx
 */
export function getViewsByRole(rol: RolSistema): View[] {
  const ALL: View[] = [
    'dashboard','proyectos','presupuestos','seguimiento','financiero',
    'rrhh','bodega','crm','apu','curvas','rendimientos','baseprecios',
    'reportes','muro','ordenes-cambio','notificaciones','sso-calidad',
    'documentos','visor-bim','predictivo','exportacion','logistica',
    'rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos',
    'impuestos','entradas-almacen'
  ];

  switch (rol) {
    case 'Administrador': return ALL;
    case 'Gerente': return ALL;
    case 'Residente': return ['dashboard','proyectos','presupuestos','seguimiento','apu',
      'curvas','rendimientos','baseprecios','reportes','muro',
      'ordenes-cambio','notificaciones','sso-calidad','documentos'];
    case 'Compras': return ['dashboard','bodega','proyectos'];
    case 'Bodeguero': return ['dashboard','bodega'];
    default: return [];
  }
}

/**
 * Valida si el usuario tiene permiso para una operacion especifica
 * LLAMAR ANTES de cualquier operacion CRUD
 */
export async function validarPermiso(
  operacion: 'insert' | 'update' | 'delete',
  view: View
): Promise<{ permitido: boolean; error?: string }> {
  const serverRole = await getServerRole();
  if (!serverRole || !serverRole.rol) {
    return { permitido: false, error: 'No autenticado' };
  }

  const allowedViews = getViewsByRole(serverRole.rol);
  if (!allowedViews.includes(view)) {
    return { permitido: false, error: 'Sin permisos para este modulo' };
  }

  if (operacion === 'delete' && serverRole.rol !== 'Administrador') {
    return { permitido: false, error: 'Solo Administradores pueden eliminar' };
  }

  return { permitido: true };
}

// ============================================================
// SANITIZACION XSS
// ============================================================

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export function sanitizarTexto(input: string | null | undefined): string {
  if (!input) return '';
  const s = String(input);
  // Escapado manual de caracteres HTML usando codigos de entidad numericos
  // para evitar problemas de encoding
  // Solo reemplaza & que NO sean parte de una entidad HTML existente (&#xx;)
  return s
    .replace(/&(?!(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]+);)/g, '&#38;')
    .replace(/</g, '&#60;')
    .replace(/>/g, '&#62;')
    .replace(/"/g, '&#34;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitiza recursivamente todas las strings en un objeto/array
 */
export function sanitizarObjeto<T>(obj: T): T {
  if (typeof obj === 'string') return sanitizarTexto(obj) as unknown as T;
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizarObjeto(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizarTexto(value);
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizarObjeto(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}