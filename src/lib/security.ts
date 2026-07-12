/**
 * Módulo de seguridad centralizado para CONSTRUSMART ERP
 * 
 * Funciones:
 * - Verificación server-side de roles via Supabase RPC
 * - Sanitización XSS (escapado HTML)
 * - Validación de inputs (longitud, tipos específicos)
 * - Jerarquía de roles autoritativa
 * - Validación de permisos para operaciones CRUD
 */

import { hasSupabase, assertSupabase } from './supabase';
import { z } from 'zod';
import type { View } from '@/erp/store';

// ============================================================
// TIPOS COMPARTIDOS
// ============================================================

export type RolSistema = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

export type { View };

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
    'rrhh','bodega','crm','apu','rendimiento-campo','baseprecios',
    'muro','ordenes-cambio','notificaciones','sso-calidad',
    'documentos','visor-bim','predictivo','exportacion','logistica',
    'comercial-fin','admin-sistema','planilla-destajos',
    'impuestos','entradas-almacen','ajustes',
    'hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones',
    'plantillas','proveedor-analytics','error-log','activos','cuadros','profitability','weather'
  ];

  switch (rol) {
    case 'Administrador': return ALL;
    case 'Gerente': return ALL;
    case 'Residente': return ['dashboard','proyectos','presupuestos','seguimiento','apu',
      'rendimiento-campo','baseprecios','muro',
      'ordenes-cambio','notificaciones','sso-calidad','documentos','profitability'];
    case 'Compras': return ['dashboard','bodega','proyectos'];
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
  const allowed = getViewsByRole(rol);
  return allowed.includes(view);
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

// ============================================================
// VALIDACION DE INPUTS
// ============================================================

interface ValidationResult {
  valido: boolean;
  error?: string;
  valorSanitizado?: string;
}

/**
 * Valida la longitud máxima de un string
 */
export function validarLongitud(
  valor: string,
  campo: string,
  min: number = 0,
  max: number = 1000
): ValidationResult {
  if (valor.length < min) {
    return { 
      valido: false, 
      error: `${campo} debe tener al menos ${min} caracteres` 
    };
  }
  if (valor.length > max) {
    return { 
      valido: false, 
      error: `${campo} no puede exceder ${max} caracteres` 
    };
  }
  return { valido: true, valorSanitizado: sanitizarTexto(valor) };
}

/**
 * Valida formato de email
 */
export function validarEmail(email: string): ValidationResult {
  const emailSchema = z.string().email('Email inválido');
  try {
    const sanitizado = sanitizarTexto(email);
    emailSchema.parse(sanitizado);
    return { valido: true, valorSanitizado: sanitizado };
  } catch (err) {
    return { 
      valido: false, 
      error: 'Email inválido. Use formato: usuario@dominio.com' 
    };
  }
}

/**
 * Valida formato de teléfono (formato GT: XXXX-XXXX o internacional)
 */
export function validarTelefono(telefono: string): ValidationResult {
  const sanitizado = sanitizarTexto(telefono);
  const telefonoSchema = z.string().regex(
    /^(\+?\d{1,3}[- ]?)?\(?\d{3,4}\)?[- ]?\d{3,4}[- ]?\d{3,4}$/,
    'Teléfono inválido'
  );
  try {
    telefonoSchema.parse(sanitizado);
    return { valido: true, valorSanitizado: sanitizado };
  } catch (err) {
    return { 
      valido: false, 
      error: 'Teléfono inválido. Use formato: XXXX-XXXX o +502 XXXX-XXXX' 
    };
  }
}

/**
 * Valida formato de NIT guatemalteco
 */
export function validarNIT(nit: string): ValidationResult {
  const sanitizado = sanitizarTexto(nit);
  const nitSchema = z.string().regex(
    /^\d{4,15}-\d{1}$/,
    'NIT inválido'
  );
  try {
    nitSchema.parse(sanitizado);
    return { valido: true, valorSanitizado: sanitizado };
  } catch (err) {
    return { 
      valido: false, 
      error: 'NIT inválido. Use formato: CIF-DV (ej: 1234567-8)' 
    };
  }
}

/**
 * Valida URL
 */
export function validarURL(url: string): ValidationResult {
  const urlSchema = z.string().url('URL inválida');
  try {
    const sanitizado = sanitizarTexto(url);
    urlSchema.parse(sanitizado);
    return { valido: true, valorSanitizado: sanitizado };
  } catch (err) {
    return { 
      valido: false, 
      error: 'URL inválida. Use formato: https://ejemplo.com' 
    };
  }
}

/**
 * Validador unificado para inputs de usuario
 * Combina sanitización XSS + validación de tipo/longitud
 */
export function validarInput(
  valor: string,
  tipo: 'texto' | 'email' | 'telefono' | 'nit' | 'url',
  campo: string = 'Campo',
  opciones?: { min?: number; max?: number }
): ValidationResult {
  const sanitizado = sanitizarTexto(valor);
  
  if (opciones?.min !== undefined || opciones?.max !== undefined) {
    const longitudValida = validarLongitud(
      sanitizado, 
      campo, 
      opciones.min || 0, 
      opciones.max || 1000
    );
    if (!longitudValida.valido) return longitudValida;
  }

  switch (tipo) {
    case 'email':
      return validarEmail(sanitizado);
    case 'telefono':
      return validarTelefono(sanitizado);
    case 'nit':
      return validarNIT(sanitizado);
    case 'url':
      return validarURL(sanitizado);
    case 'texto':
    default:
      return { valido: true, valorSanitizado: sanitizado };
  }
}

/**
 * Valida un objeto completo usando reglas de validación por campo
 */
export interface ValidacionCampo {
  tipo: 'texto' | 'email' | 'telefono' | 'nit' | 'url';
  requerido?: boolean;
  min?: number;
  max?: number;
  nombre?: string;
}

export function validarObjeto(
  objeto: Record<string, string>,
  reglas: Record<string, ValidacionCampo>
): { valido: boolean; errores: Record<string, string>; datosSanitizados: Record<string, string> } {
  const errores: Record<string, string> = {};
  const datosSanitizados: Record<string, string> = {};

  for (const [campo, valor] of Object.entries(objeto)) {
    const regla = reglas[campo];
    if (!regla) continue;

    if (regla.requerido && (!valor || valor.trim() === '')) {
      errores[campo] = `${regla.nombre || campo} es requerido`;
      continue;
    }

    if (!valor || valor.trim() === '') {
      datosSanitizados[campo] = '';
      continue;
    }

    const resultado = validarInput(
      valor,
      regla.tipo,
      regla.nombre || campo,
      { min: regla.min, max: regla.max }
    );

    if (!resultado.valido) {
      errores[campo] = resultado.error || 'Error de validación';
    } else {
      datosSanitizados[campo] = resultado.valorSanitizado || valor;
    }
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datosSanitizados
  };
}