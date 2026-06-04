/**
 * CSRF Protection Utility
 * 
 * Implementa tokens CSRF para proteger formularios y acciones
 * contra ataques de Cross-Site Request Forgery.
 * 
 * NOTA: Supabase maneja CSRF automáticamente para las llamadas API,
 * pero añadimos una capa adicional para formularios críticos.
 */

const CSRF_STORAGE_KEY = 'app_csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Genera un token CSRF aleatorio
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Obtiene o crea el token CSRF almacenado
 */
export function getCsrfToken(): string {
  let token = localStorage.getItem(CSRF_STORAGE_KEY);
  if (!token || token.length !== 64) {
    token = generateToken();
    localStorage.setItem(CSRF_STORAGE_KEY, token);
  }
  return token;
}

/**
 * Refresca el token CSRF (ej: después de login/logout)
 */
export function refreshCsrfToken(): string {
  const token = generateToken();
  localStorage.setItem(CSRF_STORAGE_KEY, token);
  return token;
}

/**
 * Obtiene los headers CSRF para incluir en peticiones
 */
export function getCsrfHeaders(): Record<string, string> {
  return {
    [CSRF_HEADER]: getCsrfToken(),
  };
}

/**
 * Valida que un token CSRF sea correcto (comparación segura contra timing attacks)
 */
export function validateCsrfToken(token: string): boolean {
  const stored = localStorage.getItem(CSRF_STORAGE_KEY);
  if (!stored || !token) return false;

  // Comparación en tiempo constante para prevenir timing attacks
  if (stored.length !== token.length) return false;

  let result = 0;
  for (let i = 0; i < stored.length; i++) {
    result |= stored.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Hook para incluir CSRF token en formularios
 * @returns Objeto con token y función para refrescar
 */
export function useCsrf() {
  return {
    token: getCsrfToken(),
    refresh: refreshCsrfToken,
    validate: validateCsrfToken,
    headers: getCsrfHeaders(),
  };
}

export default {
  getCsrfToken,
  refreshCsrfToken,
  getCsrfHeaders,
  validateCsrfToken,
  useCsrf,
};