/**
 * Encryption Module - Browser-safe AES-CBC via Web Crypto API
 * 
 * Clave derivada con SHA-256 desde ENCRYPTION_KEY, garantizando 256 bits
 * sin importar la longitud del string origen. Así se elimina el bug de
 * "AES key data must be 128 or 256 bits" cuando la env var no está definida
 * o tiene longitud incorrecta en build de Vercel/Vite.
 * 
 * Formato almacenado: ivHex:encryptedHex
 * 
 * Uso:
 * const encrypted = encryptSensitive('numero de tarjeta');
 * const decrypted = decryptSensitive(encrypted);
 */

const IV_LENGTH = 16;
const RAW_KEY = typeof import.meta.env !== 'undefined' && (import.meta.env as any).VITE_ENCRYPTION_KEY
  ? String((import.meta.env as any).VITE_ENCRYPTION_KEY)
  : 'default-dev-key-32-chars-min-!!';

async function getKeyBytes(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(RAW_KEY);
  const hash = await crypto.subtle.digest('SHA-256', raw);
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSensitive(plaintext: string): Promise<string> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await getKeyBytes();
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      encoded
    );
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const encryptedHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
    return ivHex + ':' + encryptedHex;
  } catch (error) {
    console.error('[ENCRYPTION] Error encrypting data:', error);
    throw new Error('Encryption failed');
  }
}

export async function decryptSensitive(encryptedData: string): Promise<string> {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    const iv = new Uint8Array((parts[0].match(/.{2}/g) ?? []).map(byte => parseInt(byte, 16)));
    const encrypted = new Uint8Array((parts[1].match(/.{2}/g) ?? []).map(byte => parseInt(byte, 16)));
    const key = await getKeyBytes();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('[ENCRYPTION] Error decrypting data:', error);
    throw new Error('Decryption failed');
  }
}

export async function encryptObject<T extends object>(obj: T): Promise<string> {
  const jsonString = JSON.stringify(obj);
  return encryptSensitive(jsonString);
}

export async function decryptObject<T extends object>(encrypted: string): Promise<T> {
  const jsonString = await decryptSensitive(encrypted);
  return JSON.parse(jsonString) as T;
}

export function validateEncryptionSetup(): void {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
      throw new Error(
        'ENCRYPTION_KEY must be set in environment and be at least 32 characters'
      );
    }
  }
}

export function generateEncryptionKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ENCRYPTED_PREFIX = 'enc_';

export async function migrateSecureStorage(userId: string): Promise<void> {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('wm_erp_') && !k.startsWith(ENCRYPTED_PREFIX)) {
      keys.push(k);
    }
  }
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const encrypted = await encryptSensitive(JSON.stringify({ userId, data: raw }));
      localStorage.setItem(ENCRYPTED_PREFIX + k, encrypted);
    } catch {
      console.warn('[Encryption] Migration warning for key:', k);
    }
  }
}

export const encryptionManager = {
  async encryptItem(key: string, value: unknown, userId: string): Promise<void> {
    const payload = JSON.stringify({ userId, data: value });
    const encrypted = await encryptSensitive(payload);
    localStorage.setItem(ENCRYPTED_PREFIX + key, encrypted);
  },
};

export default {
  encryptSensitive,
  decryptSensitive,
  encryptObject,
  decryptObject,
  validateEncryptionSetup,
  generateEncryptionKey,
  migrateSecureStorage,
  encryptionManager,
};
