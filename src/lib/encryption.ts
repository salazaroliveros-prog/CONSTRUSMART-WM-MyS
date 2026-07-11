/**
 * Módulo de Encriptación para localStorage
 * 
 * Funcionalidades:
 * - Encriptación/desencriptación usando Web Crypto API (AES-GCM)
 * - Clave derivada de user ID o fallback
 * - Migración automática de datos no encriptados
 * - Manejo seguro de claves
 */

const ENCRYPTION_KEY_PREFIX = 'erp_enc_key_';
const ENCRYPTED_PREFIX = 'enc_';

interface EncryptionResult {
  encrypted: string;
  iv: string;
  keyId: string;
}

class EncryptionManager {
  private keyCache: Map<string, CryptoKey> = new Map();
  private initialized = false;

  async getKey(keyId: string): Promise<CryptoKey> {
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    const storage = typeof window !== 'undefined' ? window.sessionStorage : null;
    const storedKey = storage?.getItem(`${ENCRYPTION_KEY_PREFIX}${keyId}`);
    if (storedKey) {
      const keyData = JSON.parse(storedKey);
      const key = await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      this.keyCache.set(keyId, key);
      return key;
    }

    const newKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('jwk', newKey);
    storage?.setItem(`${ENCRYPTION_KEY_PREFIX}${keyId}`, JSON.stringify(exportedKey));
    this.keyCache.set(keyId, newKey);
    return newKey;
  }

  async encrypt(data: string, keyId: string = 'default'): Promise<EncryptionResult> {
    const key = await this.getKey(keyId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const ivArray = Array.from(iv);
    const encryptedArray = Array.from(new Uint8Array(encrypted));

    return {
      encrypted: btoa(String.fromCharCode(...encryptedArray)),
      iv: btoa(String.fromCharCode(...ivArray)),
      keyId
    };
  }

  async decrypt(encryptedData: string, iv: string, keyId: string = 'default'): Promise<string> {
    const key = await this.getKey(keyId);
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      encryptedArray
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  isEncrypted(value: any): boolean {
    if (typeof value !== 'string') return false;
    try {
      const parsed = JSON.parse(value);
      return parsed.encrypted !== undefined && parsed.iv !== undefined && parsed.keyId !== undefined;
    } catch {
      return false;
    }
  }

  async encryptItem<T>(key: string, value: T, keyId: string = 'default'): Promise<void> {
    const jsonString = JSON.stringify(value);
    const encrypted = await this.encrypt(jsonString, keyId);
    localStorage.setItem(key, JSON.stringify(encrypted));
  }

  async decryptItem<T>(key: string, keyId: string = 'default'): Promise<T | null> {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      if (this.isEncrypted(stored)) {
        const parsed = JSON.parse(stored);
        const decrypted = await this.decrypt(parsed.encrypted, parsed.iv, parsed.keyId);
        return JSON.parse(decrypted) as T;
      }
      return JSON.parse(stored) as T;
    } catch (err) {
      console.error(`[Encryption] Error decrypting ${key}:`, err);
      return null;
    }
  }

  async migrateToEncrypted(key: string, keyId: string = 'default'): Promise<boolean> {
    const stored = localStorage.getItem(key);
    if (!stored || this.isEncrypted(stored)) return false;

    try {
      const value = JSON.parse(stored);
      await this.encryptItem(key, value, keyId);
      return true;
    } catch (err) {
      console.error(`[Encryption] Error migrating ${key}:`, err);
      return false;
    }
  }

  clearKeyCache() {
    this.keyCache.clear();
  }
}

export const encryptionManager = new EncryptionManager();

export async function setSecureItem<T>(key: string, value: T, userId?: string): Promise<void> {
  const keyId = userId || 'default';
  await encryptionManager.encryptItem(key, value, keyId);
}

export async function getSecureItem<T>(key: string, userId?: string): Promise<T | null> {
  const keyId = userId || 'default';
  return await encryptionManager.decryptItem<T>(key, keyId);
}

export async function migrateSecureStorage(userId?: string): Promise<void> {
  const sensitiveKeys = [
    'erp_auditLog',
    'erp_settings',
    'empresaInfo'
  ];

  const keyId = userId || 'default';
  let migratedCount = 0;

  for (const key of sensitiveKeys) {
    const migrated = await encryptionManager.migrateToEncrypted(key, keyId);
    if (migrated) migratedCount++;
  }

  console.log(`[Encryption] Migrated ${migratedCount} items to encrypted storage`);
}